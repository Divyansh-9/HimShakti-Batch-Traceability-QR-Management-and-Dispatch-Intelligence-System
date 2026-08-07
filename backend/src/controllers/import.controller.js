/**
 * ──────────────────────────────────────────────────────────────────────
 *  Bulk Batch Import
 * ──────────────────────────────────────────────────────────────────────
 *
 *  Rows arrive as already-parsed JSON (the browser reads the CSV), so there
 *  is no multipart upload and no file ever touches the server's disk. The
 *  client sends them in chunks to stay inside the serverless function
 *  timeout and the 1 MB express.json body limit.
 *
 *  Three things here differ from creating a batch one at a time, and all
 *  three exist because the single-batch path does not survive being run in
 *  a loop:
 *
 *   1. Batch codes are pre-allocated as a contiguous block, once per chunk.
 *      generateBatchCode() reads "highest code this month + 1" from the DB,
 *      so calling it N times before any insert commits hands out the same
 *      code N times. The unique index is still the real guard — duplicate
 *      key errors are caught per row and reported, never swallowed.
 *
 *   2. Product resolution is per-row fault-isolated. assertProductContract()
 *      throws DB_CONTRACT, which errorHandler maps to 503; letting that
 *      bubble would abort an entire 5,000-row import because of one bad
 *      product in the other team's collection.
 *
 *   3. Rollback soft-deletes. Traceability records are never hard-deleted,
 *      so an undone import stays recoverable from the Archived tab.
 * ──────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
const Batch     = require('../models/Batch.model');
const ImportJob = require('../models/ImportJob.model');
const { calculateExpiry, getBatchStatus, calculatePriorityScore } = require('../services/expiryCalculator');
const { generateBatchQR }       = require('../services/qrGenerator');
const { assertProductContract } = require('../utils/productContract');
const { notifyRoles }           = require('../services/notificationService');

// Largest chunk the server will accept in one request. The client splits to
// match; anything bigger is rejected rather than silently truncated.
const MAX_CHUNK_ROWS = 500;

// Cap stored row errors so one hopeless file cannot push an ImportJob
// document toward Mongo's 16 MB limit.
const MAX_STORED_ERRORS = 200;

const UNIT_ALIASES = {
  kg: 'Kg', kgs: 'Kg', kilo: 'Kg', kilos: 'Kg', kilogram: 'Kg', kilograms: 'Kg',
  unit: 'Units', units: 'Units', pc: 'Units', pcs: 'Units', piece: 'Units', pieces: 'Units', nos: 'Units',
  l: 'Liters', ltr: 'Liters', ltrs: 'Liters', liter: 'Liters', liters: 'Liters', litre: 'Liters', litres: 'Liters',
};

/**
 * Canonical import columns. The frontend reads this from GET /api/import/schema
 * so the mapping UI and the validator can never drift apart.
 *
 * `aliases` drives header auto-detection; they are compared lowercased with
 * all non-alphanumerics stripped, so "Pack Date", "pack_date" and "PACKDATE"
 * all collapse to the same token.
 */
const IMPORT_COLUMNS = [
  {
    key: 'productSku', label: 'Product SKU', required: true,
    aliases: ['sku', 'productsku', 'productcode', 'itemsku', 'itemcode', 'batchsku', 'skucode'],
    hint: 'Matched against the product catalogue. Either this or Product Name is required.',
  },
  {
    key: 'productName', label: 'Product Name', required: false,
    aliases: ['product', 'productname', 'itemname', 'item'],
    hint: 'Fallback when the sheet has no SKU column. Must match a catalogue product exactly.',
  },
  {
    key: 'sourceLotCode', label: 'Source Lot Code', required: true,
    aliases: ['lot', 'lotcode', 'sourcelot', 'sourcelotcode', 'rawlot', 'lotno', 'lotnumber'],
    hint: 'Raw-material lot this batch was produced from.',
  },
  {
    key: 'farmerName', label: 'Farmer Name', required: true,
    aliases: ['farmer', 'farmername', 'supplier', 'suppliername', 'grower'],
  },
  {
    key: 'village', label: 'Village', required: true,
    aliases: ['village', 'source', 'origin', 'location'],
  },
  {
    key: 'quantityProduced', label: 'Quantity Produced', required: true,
    aliases: ['quantity', 'qty', 'quantityproduced', 'output', 'produced'],
    hint: 'Whole or decimal number, at least 1.',
  },
  {
    key: 'unit', label: 'Unit', required: true,
    aliases: ['unit', 'uom', 'units', 'measure'],
    hint: 'Kg, Units or Liters. Common spellings (kgs, pcs, litres) are accepted.',
  },
  {
    key: 'yieldPercent', label: 'Yield %', required: true,
    aliases: ['yield', 'yieldpercent', 'yieldpct', 'yieldpercentage', 'recovery'],
    hint: '0 to 100.',
  },
  {
    key: 'packDate', label: 'Pack Date', required: true,
    aliases: ['packdate', 'packed', 'packedon', 'productiondate', 'date', 'mfgdate', 'manufactured'],
    hint: 'DD/MM/YYYY or YYYY-MM-DD. Expiry is derived from the product shelf life.',
  },
];

// ── Parsing helpers ───────────────────────────────────────────────────

/** Collapse a header to its comparison token: lowercase, alphanumerics only. */
function headerToken(h) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cleanString(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function parseNumber(v) {
  const s = cleanString(v).replace(/,/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a spreadsheet date.
 *
 * Order matters: DD/MM/YYYY is tried before MM/DD/YYYY because this is an
 * Indian supply-chain system and 03/04/2026 means 3 April here. Unambiguous
 * ISO input always wins, so exporters that emit YYYY-MM-DD are unaffected.
 */
function parseDate(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  const s = cleanString(v);
  if (!s) return null;

  // ISO — YYYY-MM-DD (optionally with a time component)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return isNaN(d) ? null : d;
  }

  // Day-first — DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const day = +dmy[1], month = +dmy[2], year = +dmy[3];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d) ? null : d;
  }

  return null;
}

function normaliseUnit(v) {
  const s = cleanString(v).toLowerCase().replace(/[^a-z]/g, '');
  return UNIT_ALIASES[s] || null;
}

/** Stable identity for "this physical production run". */
function dedupeKey(sku, lot, packDate) {
  const day = packDate instanceof Date ? packDate.toISOString().slice(0, 10) : String(packDate);
  return `${String(sku).toUpperCase()}|${String(lot).toUpperCase()}|${day}`;
}

// ── Row validation ────────────────────────────────────────────────────

/**
 * Validate and coerce one raw row into the shape createBatch would have
 * produced. Returns { ok, value, errors } — never throws, so one malformed
 * row cannot take the request down.
 */
function validateRow(raw) {
  const errors = [];
  const value  = {};

  const sku  = cleanString(raw.productSku).toUpperCase();
  const name = cleanString(raw.productName);
  if (!sku && !name) {
    errors.push({ field: 'productSku', message: 'Needs a Product SKU or a Product Name' });
  }
  value.productSku  = sku;
  value.productName = name;

  value.sourceLotCode = cleanString(raw.sourceLotCode).toUpperCase();
  if (!value.sourceLotCode) errors.push({ field: 'sourceLotCode', message: 'Source lot code is required' });

  value.farmerName = cleanString(raw.farmerName);
  if (!value.farmerName) errors.push({ field: 'farmerName', message: 'Farmer name is required' });

  value.village = cleanString(raw.village);
  if (!value.village) errors.push({ field: 'village', message: 'Village is required' });

  const qty = parseNumber(raw.quantityProduced);
  if (qty === null)      errors.push({ field: 'quantityProduced', message: 'Quantity must be a number' });
  else if (qty < 1)      errors.push({ field: 'quantityProduced', message: 'Quantity must be at least 1' });
  value.quantityProduced = qty;

  const unit = normaliseUnit(raw.unit);
  if (!unit) errors.push({ field: 'unit', message: 'Unit must be Kg, Units or Liters' });
  value.unit = unit;

  const yieldPct = parseNumber(raw.yieldPercent);
  if (yieldPct === null)                    errors.push({ field: 'yieldPercent', message: 'Yield must be a number' });
  else if (yieldPct < 0 || yieldPct > 100)  errors.push({ field: 'yieldPercent', message: 'Yield must be between 0 and 100' });
  value.yieldPercent = yieldPct;

  const packDate = parseDate(raw.packDate);
  if (!packDate) errors.push({ field: 'packDate', message: 'Pack date must be DD/MM/YYYY or YYYY-MM-DD' });
  value.packDate = packDate;

  return { ok: errors.length === 0, value, errors };
}

// ── Bulk lookups (one query each, never per row) ──────────────────────

/**
 * Resolve every referenced product in a single query and return two lookup
 * maps. Products are the other team's read-only collection, so nothing here
 * writes; rows referencing a product that fails the contract are marked
 * invalid rather than raising a 503 for the whole import.
 */
async function resolveProducts(rows) {
  const skus  = [...new Set(rows.map(r => r.value.productSku).filter(Boolean))];
  const names = [...new Set(rows.map(r => r.value.productName).filter(Boolean))];
  if (!skus.length && !names.length) return { bySku: new Map(), byName: new Map(), rejected: new Map() };

  const or = [];
  if (skus.length)  or.push({ sku:         { $in: skus } });
  if (names.length) or.push({ productName: { $in: names } });

  const products = await mongoose.connection.db
    .collection('products')
    .find({ $or: or })
    .toArray();

  const bySku = new Map(), byName = new Map(), rejected = new Map();
  for (const p of products) {
    try {
      assertProductContract(p);
      if (p.sku)         bySku.set(String(p.sku).toUpperCase(), p);
      if (p.productName) byName.set(p.productName, p);
    } catch (err) {
      // Contract violation is a data problem with one product, not an outage.
      const label = String(p.sku || p.productName || p._id).toUpperCase();
      rejected.set(label, err.message.replace(/^DB_CONTRACT:\s*/, ''));
    }
  }
  return { bySku, byName, rejected };
}

/** Existing dedupe keys for the lots/SKUs in this chunk. One query. */
async function findExistingKeys(rows) {
  const lots = [...new Set(rows.map(r => r.value.sourceLotCode).filter(Boolean))];
  if (!lots.length) return new Set();

  const existing = await Batch.find(
    { sourceLotCode: { $in: lots } },
    { sourceLotCode: 1, sku: 1, packDate: 1 }
  ).lean();

  return new Set(existing.map(b => dedupeKey(b.sku, b.sourceLotCode, new Date(b.packDate))));
}

/**
 * Reserve `count` consecutive batch codes for the current month in one query.
 *
 * Mirrors generateBatchCode() but hands out a block instead of a single code,
 * turning N round-trips into one and closing the window where every call in a
 * loop reads the same "highest existing" value.
 */
async function preallocateBatchCodes(count) {
  const now    = new Date();
  const prefix = `HS-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;

  const last = await Batch.findOne(
    { batchCode: { $regex: `^${prefix}` } },
    { batchCode: 1 },
    { sort: { batchCode: -1 } }
  ).lean();

  let next = 1;
  if (last) next = parseInt(last.batchCode.split('-')[3], 10) + 1;

  const codes = [];
  for (let i = 0; i < count; i++) codes.push(`${prefix}${String(next + i).padStart(3, '0')}`);
  return codes;
}

// ── Shared analysis pass ──────────────────────────────────────────────

/**
 * Classify every row as insert / skip / error without writing anything.
 * Both the dry run and the commit use this, so the preview a user approves
 * is produced by exactly the code that then does the work.
 *
 * @param {Array}  rawRows   mapped rows, in sheet order
 * @param {number} rowOffset 1-based sheet row of rawRows[0], for error labels
 */
async function analyseRows(rawRows, rowOffset = 1) {
  const validated = rawRows.map(validateRow);
  const { bySku, byName, rejected } = await resolveProducts(validated);
  const existingKeys = await findExistingKeys(validated);

  // Duplicates *inside* the file matter as much as duplicates against the DB.
  const seenInFile = new Set();
  const results    = [];

  for (let i = 0; i < validated.length; i++) {
    const { ok, value, errors } = validated[i];
    const rowNum = rowOffset + i;
    const rowErrors = [...errors];
    let product = null;

    if (ok || (value.productSku || value.productName)) {
      product = (value.productSku && bySku.get(value.productSku))
             || (value.productName && byName.get(value.productName))
             || null;

      if (!product) {
        const label  = value.productSku || value.productName;
        const reason = rejected.get(String(label).toUpperCase());
        rowErrors.push({
          field: 'productSku',
          message: reason
            ? `Product "${label}" failed the catalogue contract: ${reason}`
            : `No catalogue product matches "${label}"`,
        });
      }
    }

    if (rowErrors.length) {
      results.push({ row: rowNum, verdict: 'error', errors: rowErrors, value });
      continue;
    }

    const key = dedupeKey(product.sku, value.sourceLotCode, value.packDate);
    if (existingKeys.has(key)) {
      results.push({
        row: rowNum, verdict: 'skip', value, product,
        reason: `Already imported — lot ${value.sourceLotCode} / ${product.sku} / ${value.packDate.toISOString().slice(0, 10)}`,
      });
      continue;
    }
    if (seenInFile.has(key)) {
      results.push({
        row: rowNum, verdict: 'skip', value, product,
        reason: `Duplicate of an earlier row in this file (same lot, product and pack date)`,
      });
      continue;
    }

    seenInFile.add(key);
    results.push({ row: rowNum, verdict: 'insert', value, product });
  }

  return results;
}

function summarise(results) {
  return {
    insert: results.filter(r => r.verdict === 'insert').length,
    skip:   results.filter(r => r.verdict === 'skip').length,
    error:  results.filter(r => r.verdict === 'error').length,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Controllers
// ──────────────────────────────────────────────────────────────────────

/**
 * @desc    Column contract for the mapping UI
 * @route   GET /api/import/schema
 * @access  Private (importer)
 */
async function getImportSchema(_req, res) {
  res.json({
    success: true,
    data: {
      columns:    IMPORT_COLUMNS.map(({ aliases, ...rest }) => rest),
      maxChunkRows: MAX_CHUNK_ROWS,
      dedupeRule: 'Source Lot Code + Product SKU + Pack Date',
    },
  });
}

/**
 * @desc    Auto-match sheet headers to canonical columns
 * @route   POST /api/import/map-headers
 * @access  Private (importer)
 */
async function mapHeaders(req, res, next) {
  try {
    const headers = Array.isArray(req.body?.headers) ? req.body.headers : [];
    const taken   = new Set();
    const mapping = {};

    for (const col of IMPORT_COLUMNS) {
      const match = headers.find(h => {
        if (taken.has(h)) return false;
        const t = headerToken(h);
        return t === headerToken(col.key) || t === headerToken(col.label) || col.aliases.includes(t);
      });
      if (match) { mapping[col.key] = match; taken.add(match); }
    }

    const unmappedRequired = IMPORT_COLUMNS
      .filter(c => c.required && !mapping[c.key])
      .map(c => c.key)
      // Either SKU or Name satisfies product identity.
      .filter(k => !(k === 'productSku' && mapping.productName));

    res.json({ success: true, data: { mapping, unmappedRequired } });
  } catch (err) { next(err); }
}

/**
 * @desc    Dry run — classify rows, write nothing
 * @route   POST /api/import/validate
 * @access  Private (importer)
 */
async function validateImport(req, res, next) {
  try {
    const { rows = [], rowOffset = 2 } = req.body || {};
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ success: false, error: 'No rows supplied' });
    }
    if (rows.length > MAX_CHUNK_ROWS) {
      return res.status(413).json({
        success: false,
        error: `Too many rows in one request — send at most ${MAX_CHUNK_ROWS} per chunk`,
      });
    }

    const results = await analyseRows(rows, rowOffset);

    res.json({
      success: true,
      data: {
        summary: summarise(results),
        // Strip the resolved product doc — the preview only needs identity.
        rows: results.map(r => ({
          row:     r.row,
          verdict: r.verdict,
          reason:  r.reason || null,
          errors:  r.errors || [],
          preview: {
            productName: r.product?.productName || r.value.productName || null,
            sku:         r.product?.sku || r.value.productSku || null,
            lot:         r.value.sourceLotCode || null,
            farmer:      r.value.farmerName || null,
            quantity:    r.value.quantityProduced,
            unit:        r.value.unit,
            packDate:    r.value.packDate ? r.value.packDate.toISOString().slice(0, 10) : null,
          },
        })),
      },
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Commit one chunk — creates the job on the first call
 * @route   POST /api/import/commit
 * @access  Private (importer)
 */
async function commitImport(req, res, next) {
  try {
    const {
      jobId, fileName = 'import.csv', rows = [],
      rowOffset = 2, totalRows = 0, isFinal = true,
    } = req.body || {};

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ success: false, error: 'No rows supplied' });
    }
    if (rows.length > MAX_CHUNK_ROWS) {
      return res.status(413).json({
        success: false,
        error: `Too many rows in one request — send at most ${MAX_CHUNK_ROWS} per chunk`,
      });
    }

    const actor = req.user?.name || req.user?.username || 'unknown';

    // First chunk opens the job; later chunks attach to it.
    let job;
    if (jobId) {
      job = await ImportJob.findById(jobId);
      if (!job)                      return res.status(404).json({ success: false, error: 'Import job not found' });
      if (job.status === 'rolled_back') return res.status(409).json({ success: false, error: 'This import was rolled back and cannot be resumed' });
    } else {
      job = await ImportJob.create({
        fileName, entity: 'batch', status: 'running',
        totalRows, createdBy: actor, createdByRole: req.user?.role || null,
      });
    }

    const results  = await analyseRows(rows, rowOffset);
    const toInsert = results.filter(r => r.verdict === 'insert');

    // Build the documents. QR generation is the expensive step, so it runs
    // only for rows that survived validation and deduplication.
    const codes = toInsert.length ? await preallocateBatchCodes(toInsert.length) : [];
    const docs  = [];
    const buildErrors = [];

    for (let i = 0; i < toInsert.length; i++) {
      const { value, product, row } = toInsert[i];
      try {
        const { expiryDate, daysUntilExpiry, dataSource, shelfLifeSource } =
          calculateExpiry(product, value.packDate);

        const batchCode = codes[i];
        const { dataUrl: qrCodeDataUrl, absoluteUrl: qrAbsoluteUrl, traceToken } = await generateBatchQR(batchCode);

        docs.push({
          productId:   product._id,
          productName: product.productName,
          sku:         product.sku,
          sourceLotCode:    value.sourceLotCode,
          farmerName:       value.farmerName,
          village:          value.village,
          quantityProduced: value.quantityProduced,
          unit:             value.unit,
          yieldPercent:     value.yieldPercent,
          batchCode,
          packDate:   value.packDate,
          expiryDate,
          dataSource,
          shelfLifeSource,
          status:        getBatchStatus(daysUntilExpiry),
          priorityScore: calculatePriorityScore(daysUntilExpiry, product.riskLevel),
          qrCodeDataUrl,
          qrAbsoluteUrl,
          traceToken,
          traceabilityNote: product.predictedExpiryTemplate
            ? product.predictedExpiryTemplate.replace('{days}', Math.round(daysUntilExpiry))
            : `Best before ${expiryDate.toDateString()}`,
          createdBy: actor,
          // Provenance, in the append-only log the rest of the app already reads.
          noteHistory: [{
            note:     `Bulk imported from ${fileName} (import #${job._id})`,
            editedBy: actor,
            editedAt: new Date(),
          }],
        });
        docs[docs.length - 1].__row = row;
      } catch (err) {
        buildErrors.push({ row, field: null, message: err.message });
      }
    }

    // ordered:false so one duplicate-key collision does not abandon the rest.
    let insertedDocs = [];
    const writeErrors = [];
    if (docs.length) {
      const payload = docs.map(({ __row, ...d }) => d);
      try {
        insertedDocs = await Batch.insertMany(payload, { ordered: false, rawResult: false });
      } catch (err) {
        insertedDocs = err.insertedDocs || [];
        for (const we of err.writeErrors || []) {
          writeErrors.push({
            row:     docs[we.index]?.__row ?? null,
            field:   null,
            message: we.code === 11000
              ? `Batch code collided with a concurrent write — re-run this row`
              : we.errmsg || 'Insert failed',
          });
        }
      }
    }

    // ── Fold this chunk into the job ────────────────────────────────
    const chunkErrors = [
      ...results.filter(r => r.verdict === 'error')
               .flatMap(r => r.errors.map(e => ({ row: r.row, field: e.field, message: e.message }))),
      ...buildErrors,
      ...writeErrors,
    ];

    job.inserted      += insertedDocs.length;
    job.skipped       += results.filter(r => r.verdict === 'skip').length;
    job.errored       += results.filter(r => r.verdict === 'error').length + buildErrors.length + writeErrors.length;
    job.processedRows += rows.length;
    job.insertedBatchIds.push(...insertedDocs.map(d => d._id));

    const room = MAX_STORED_ERRORS - job.rowErrors.length;
    if (room > 0) job.rowErrors.push(...chunkErrors.slice(0, room));
    if (chunkErrors.length > Math.max(room, 0)) job.rowErrorsTruncated = true;

    if (isFinal) {
      job.status     = job.inserted === 0 && job.errored > 0 ? 'failed' : 'done';
      job.finishedAt = new Date();
    }
    await job.save();

    // ── Push the new batches into live dashboards ───────────────────
    const io = req.app.get('io');
    if (io && insertedDocs.length) io.emit('batch:created', { bulk: true, count: insertedDocs.length });

    if (isFinal) {
      notifyRoles(req.app, ['factory-manager', 'manager'], {
        type:    'batch_imported',
        title:   'Bulk import finished',
        message: `${job.inserted} batch${job.inserted === 1 ? '' : 'es'} imported from ${fileName}` +
                 `${job.skipped ? `, ${job.skipped} skipped` : ''}` +
                 `${job.errored ? `, ${job.errored} failed` : ''}.`,
        refId:   String(job._id),
        refType: 'import',
        triggeredBy: {
          userId: req.user?._id || null,
          name:   actor,
          role:   req.user?.role || null,
        },
      }); // fire-and-forget
    }

    res.status(201).json({
      success: true,
      data: {
        jobId:    job._id,
        status:   job.status,
        chunk:    { inserted: insertedDocs.length, ...summarise(results) },
        totals:   { inserted: job.inserted, skipped: job.skipped, errored: job.errored },
        errors:   chunkErrors.slice(0, 50),
      },
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Undo an import by soft-deleting every batch it inserted
 * @route   POST /api/import/:id/rollback
 * @access  Private (importer)
 *
 * Deliberately not a hard delete. The batches remain in the Archived tab with
 * a deleteNote naming the import, so the traceability chain stays intact and
 * an accidental rollback is recoverable through the existing restore route.
 */
async function rollbackImport(req, res, next) {
  try {
    const job = await ImportJob.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Import job not found' });
    if (job.status === 'rolled_back') {
      return res.status(409).json({ success: false, error: 'This import has already been rolled back' });
    }
    if (job.status === 'running') {
      return res.status(409).json({ success: false, error: 'Import is still running — wait for it to finish' });
    }
    if (!job.insertedBatchIds.length) {
      return res.status(409).json({ success: false, error: 'This import inserted nothing to roll back' });
    }

    const actor = req.user?.name || req.user?.username || 'unknown';

    // Only touch rows this job inserted that are still live, so a batch
    // archived by hand after the import keeps its original delete reason.
    const result = await Batch.updateMany(
      { _id: { $in: job.insertedBatchIds }, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted:  true,
          deletedAt:  new Date(),
          deletedBy:  actor,
          deleteNote: `Rolled back import #${job._id} (${job.fileName})`,
        },
      }
    );

    job.status       = 'rolled_back';
    job.rolledBackAt = new Date();
    job.rolledBackBy = actor;
    await job.save();

    const io = req.app.get('io');
    if (io) io.emit('batch:created', { bulk: true, rolledBack: true });

    res.json({
      success: true,
      message: `Rolled back ${result.modifiedCount} batch${result.modifiedCount === 1 ? '' : 'es'} — archived, not deleted`,
      data: { jobId: job._id, archived: result.modifiedCount, status: job.status },
    });
  } catch (err) { next(err); }
}

/**
 * @desc    Import history, newest first
 * @route   GET /api/import
 * @access  Private (importer)
 */
async function listImports(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const jobs  = await ImportJob.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-insertedBatchIds -rowErrors');  // heavy fields stay out of the list
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) { next(err); }
}

/**
 * @desc    One import with its row errors
 * @route   GET /api/import/:id
 * @access  Private (importer)
 */
async function getImport(req, res, next) {
  try {
    const job = await ImportJob.findById(req.params.id).select('-insertedBatchIds');
    if (!job) return res.status(404).json({ success: false, error: 'Import job not found' });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
}

module.exports = {
  getImportSchema,
  mapHeaders,
  validateImport,
  commitImport,
  rollbackImport,
  listImports,
  getImport,
  // exported for reuse/inspection
  IMPORT_COLUMNS,
  MAX_CHUNK_ROWS,
};
