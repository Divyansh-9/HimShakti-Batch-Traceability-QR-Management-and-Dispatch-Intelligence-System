/**
 * qr.controller.js — public, unauthenticated QR trace flow
 * ──────────────────────────────────────────────────────────────────
 * Two resolution paths, deliberately unequal:
 *
 *   GET /trace/t/:token     full record. Reached only by scanning a QR,
 *                           which carries an unguessable derived token.
 *   GET /trace/:batchCode   reduced record. Kept so QR labels printed
 *                           before tokens existed keep resolving.
 *
 * The split exists because batch codes are sequential and this endpoint
 * has no auth: anyone can walk `HS-2026-06-001` upward. That cannot be
 * closed without breaking already-printed labels, so instead the
 * enumerable path returns only what is already on the physical package —
 * product, expiry, freshness. Farmer, village, lot code, volumes and
 * yield require the token. Enumeration still works; it just stops
 * being worth doing.
 */
const crypto     = require('crypto');
const Batch      = require('../models/Batch.model');
const ScanEvent  = require('../models/ScanEvent.model');
const { getBatchStatus } = require('../services/expiryCalculator');

/** Fields never sent on the enumerable path. */
const RESTRICTED_FIELDS = ['farmerName', 'village', 'sourceLotCode', 'quantityProduced', 'yieldPercent', 'unit'];

/**
 * Record the scan. Fire-and-forget: a logging failure must never stop a
 * consumer seeing their product's provenance.
 */
function logScan(req, batch, channel) {
  const ua = req.headers['user-agent'] || '';
  let deviceType = 'Desktop';
  if (/mobile/i.test(ua))           deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  // Raw IP is hashed before storage and never persisted in the clear.
  const rawIP  = req.ip || 'unknown';
  const ipHash = crypto.createHash('sha256').update(rawIP + process.env.JWT_SECRET).digest('hex');

  ScanEvent.create({
    batchId:   batch._id,
    batchCode: batch.batchCode,
    // `source` was previously read straight from req.query, so any caller
    // could label their own scan 'QA'. It is now derived from which URL
    // resolved: a token scan came off a real printed label.
    source:    channel === 'token' ? 'buyer' : 'factory',
    deviceType,
    ipHash,
  }).catch(err => console.error('Scan log error:', err.message));
}

/**
 * Shape the public response.
 * @param {boolean} full  include the restricted provenance fields
 */
function buildTracePayload(batch, full) {
  const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - new Date()) / 86400000);
  const status          = batch.status === 'DISPATCHED' ? 'DISPATCHED' : getBatchStatus(daysUntilExpiry);

  const payload = {
    batchCode:   batch.batchCode,
    productName: batch.productName,
    sku:         batch.sku,
    packDate:    batch.packDate,
    expiryDate:  batch.expiryDate,
    daysUntilExpiry,
    status,
    dataSource:  batch.dataSource,
    traceabilityNote: batch.traceabilityNote,
    detailLevel: full ? 'full' : 'limited',
    warning:
      status === 'URGENT'  ? `This batch expires in ${daysUntilExpiry} days.` :
      status === 'EXPIRED' ? `This batch expired on ${new Date(batch.expiryDate).toDateString()}.` :
      null,
  };

  if (full) {
    for (const field of RESTRICTED_FIELDS) payload[field] = batch[field];

    // Quality verdict is surfaced to consumers ONLY when it passed.
    // A FAILED or FLAGGED batch should never have reached a consumer's
    // hands; publishing that verdict on a public page would broadcast an
    // internal QA judgement about a product already in distribution,
    // with no context and no right of reply. Withheld, not hidden — it
    // stays on the batch record for auditors and staff.
    const qc = batch.qualityCheck;
    if (qc && qc.status === 'PASSED') {
      payload.qualityCheck = {
        rating:        qc.rating,
        inspectedAt:   qc.inspectedAt,
        inspectorName: qc.inspectorName,
      };
    }
  }

  return payload;
}

/**
 * @desc    Full public trace — resolved by opaque QR token
 * @route   GET /trace/t/:token
 * @access  Public
 */
async function getTraceByToken(req, res, next) {
  try {
    const batch = await Batch.findOne({ traceToken: req.params.token, isDeleted: false })
      .select('-qrCodeDataUrl');
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found. QR code may be invalid.' });
    }

    logScan(req, batch, 'token');
    res.json({ success: true, data: buildTracePayload(batch, true) });
  } catch (err) { next(err); }
}

/**
 * @desc    Reduced public trace — legacy path for QR labels printed
 *          before tokens existed
 * @route   GET /trace/:batchCode
 * @access  Public
 */
async function getTraceabilityPage(req, res, next) {
  try {
    const batch = await Batch.findOne({ batchCode: req.params.batchCode.toUpperCase(), isDeleted: false })
      .select('-qrCodeDataUrl');
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found. QR code may be invalid.' });
    }

    // Note: no status writeback here.
    //
    // This route previously called findByIdAndUpdate to persist the
    // recomputed status, which meant an unauthenticated GET performed a
    // database write — a non-idempotent read, and a write amplifier
    // available to anonymous callers on an enumerable URL. It was also
    // redundant: status is recomputed on every read path anyway, so the
    // stored value is decorative. Removed.

    logScan(req, batch, 'legacy');
    res.json({ success: true, data: buildTracePayload(batch, false) });
  } catch (err) { next(err); }
}

/**
 * @desc    QR PNG for a batch
 * @route   GET /api/qr/:batchCode/image
 * @access  Public
 */
async function getQRImage(req, res, next) {
  try {
    const batch = await Batch.findOne(
      { batchCode: req.params.batchCode.toUpperCase() },
      { qrCodeDataUrl: 1, batchCode: 1 }
    );
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: { batchCode: batch.batchCode, qrCodeDataUrl: batch.qrCodeDataUrl } });
  } catch (err) { next(err); }
}

module.exports = { getTraceabilityPage, getTraceByToken, getQRImage };
