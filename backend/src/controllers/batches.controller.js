const mongoose = require('mongoose');
const Batch      = require('../models/Batch.model');
const ScanEvent  = require('../models/ScanEvent.model');
const { calculateExpiry, getBatchStatus, calculatePriorityScore } = require('../services/expiryCalculator');
const { generateBatchCode } = require('../utils/batchCodeGenerator');
const { generateBatchQR }   = require('../services/qrGenerator');
const { assertProductContract } = require('../utils/productContract');

// ── Helper: enrich batch with live daysUntilExpiry ──────────────────
function enrichBatch(b) {
  const days = Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000);
  return { ...b.toObject(), daysUntilExpiry: days };
}

async function createBatch(req, res, next) {
  try {
    const {
      productId, packDate, quantityProduced, unit,
      yieldPercent, sourceLotCode, farmerName, village
    } = req.body;

    const product = await mongoose.connection.db
      .collection('products')
      .findOne({ _id: new mongoose.Types.ObjectId(productId) });

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    assertProductContract(product);

    const parsed = new Date(packDate);
    const { expiryDate, daysUntilExpiry, dataSource, shelfLifeSource } = calculateExpiry(product, parsed);

    const batchCode = await generateBatchCode();
    const { dataUrl: qrCodeDataUrl, absoluteUrl: qrAbsoluteUrl } = await generateBatchQR(batchCode);

    const status        = getBatchStatus(daysUntilExpiry);
    const priorityScore = calculatePriorityScore(daysUntilExpiry, product.riskLevel);

    const traceabilityNote = product.predictedExpiryTemplate
      ? product.predictedExpiryTemplate.replace('{days}', Math.round(daysUntilExpiry))
      : `Best before ${expiryDate.toDateString()}`;

    const batch = await Batch.create({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      sourceLotCode,
      farmerName,
      village,
      quantityProduced,
      unit,
      yieldPercent,
      batchCode,
      packDate: parsed,
      expiryDate,
      dataSource,
      shelfLifeSource,
      status,
      priorityScore,
      qrCodeDataUrl,
      qrAbsoluteUrl,
      traceabilityNote,
      createdBy: req.user?.name || req.user?.username || 'manager'
    });

    const io = req.app.get('io');
    if (io) io.emit('batch:created', enrichBatch(batch));

    res.status(201).json({
      success: true,
      message: `Batch ${batchCode} created successfully`,
      data: enrichBatch(batch)
    });
  } catch (err) { next(err); }
}

async function getAllBatches(req, res, next) {
  try {
    const { status, sku, page = 1, limit = 100, includeDeleted } = req.query;
    // Use $ne: true so pre-existing docs without the field are also included
    const filter = { isDeleted: { $ne: true } };
    if (includeDeleted === 'true' && req.user?.role === 'admin') delete filter.isDeleted;
    if (status) filter.status = status.toUpperCase();
    if (sku)    filter.sku    = sku.toUpperCase();

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Batch.countDocuments(filter);

    const batches = await Batch.find(filter)
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-qrCodeDataUrl');  // omit heavy base64 from list

    const enriched = batches.map(enrichBatch);
    res.json({ success: true, total, page: parseInt(page), count: enriched.length, data: enriched });
  } catch (err) { next(err); }
}

async function getBatchById(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: enrichBatch(batch) });
  } catch (err) { next(err); }
}

async function recordDispatch(req, res, next) {
  try {
    const { buyerName, dispatchDate } = req.body;
    if (!buyerName) return res.status(400).json({ success: false, error: 'buyerName is required' });

    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { status: 'DISPATCHED', buyerName, dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date() },
      { new: true, runValidators: true }
    );
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const io = req.app.get('io');
    if (io) io.emit('batch:updated', { batchId: batch._id, batchCode: batch.batchCode, status: 'DISPATCHED' });

    res.json({ success: true, message: `Batch ${batch.batchCode} marked as DISPATCHED`, data: batch });
  } catch (err) { next(err); }
}

// @desc  Update only the traceabilityNote (audit-safe — core fields are sealed)
// @route PATCH /api/batches/:id/note
// @access factory-manager, manager, admin
async function updateBatchNote(req, res, next) {
  try {
    const { note } = req.body;
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }
    if (note.trim().length > 1000) {
      return res.status(400).json({ success: false, error: 'Note must be 1000 characters or fewer' });
    }

    // Roles that may edit notes
    const allowed = ['admin', 'manager', 'factory-manager'];
    if (!allowed.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to edit notes' });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    if (batch.isDeleted) return res.status(410).json({ success: false, error: 'Batch has been archived' });

    // Push the OLD note into history before overwriting
    batch.noteHistory.push({
      note:     batch.traceabilityNote,
      editedBy: req.user?.username || req.user?.name || 'unknown',
      editedAt: new Date(),
    });
    batch.traceabilityNote = note.trim();
    await batch.save();

    const io = req.app.get('io');
    if (io) io.emit('batch:noteUpdated', { batchId: batch._id, batchCode: batch.batchCode });

    res.json({
      success: true,
      message: 'Traceability note updated',
      data: { traceabilityNote: batch.traceabilityNote, noteHistory: batch.noteHistory }
    });
  } catch (err) { next(err); }
}

// @desc  Soft-delete a batch (admin only). Sets isDeleted=true, records who/when/why.
//        ScanEvent records are preserved. The batch remains restorable.
// @route DELETE /api/batches/:id
// @access admin only
async function softDeleteBatch(req, res, next) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can archive batches' });
    }

    const { reason } = req.body; // optional deletion reason

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    if (batch.isDeleted) return res.status(409).json({ success: false, error: 'Batch is already archived' });

    batch.isDeleted  = true;
    batch.deletedAt  = new Date();
    batch.deletedBy  = req.user?.username || req.user?.name || 'admin';
    batch.deleteNote = reason?.trim() || null;
    await batch.save();

    const io = req.app.get('io');
    if (io) io.emit('batch:deleted', { batchId: batch._id, batchCode: batch.batchCode });

    res.json({ success: true, message: `Batch ${batch.batchCode} archived`, data: { batchCode: batch.batchCode } });
  } catch (err) { next(err); }
}

// @desc  Restore a soft-deleted batch (admin only)
// @route PATCH /api/batches/:id/restore
// @access admin only
async function restoreBatch(req, res, next) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can restore batches' });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    if (!batch.isDeleted) return res.status(409).json({ success: false, error: 'Batch is not archived' });

    batch.isDeleted  = false;
    batch.deletedAt  = null;
    batch.deletedBy  = null;
    batch.deleteNote = null;
    await batch.save();

    const io = req.app.get('io');
    if (io) io.emit('batch:restored', { batchId: batch._id, batchCode: batch.batchCode });

    res.json({ success: true, message: `Batch ${batch.batchCode} restored`, data: enrichBatch(batch) });
  } catch (err) { next(err); }
}

// @desc  Scan analytics for a batch
// @route GET /api/batches/:id/scans
async function getBatchScans(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id).select('batchCode');
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const events = await ScanEvent.find({ batchCode: batch.batchCode })
      .sort({ scannedAt: -1 })
      .select('scannedAt deviceType source');

    const mobileCount  = events.filter(e => e.deviceType === 'Mobile').length;
    const desktopCount = events.filter(e => e.deviceType === 'Desktop').length;
    const tabletCount  = events.filter(e => e.deviceType === 'Tablet').length;

    res.json({
      success:    true,
      batchCode:  batch.batchCode,
      totalScans: events.length,
      lastScanAt: events[0]?.scannedAt || null,
      breakdown:  { mobile: mobileCount, desktop: desktopCount, tablet: tabletCount },
      recentScans: events.slice(0, 5),
    });
  } catch (err) { next(err); }
}

// @desc  Update raw material source fields (correction workflow)
// @route PATCH /api/batches/:id/raw-material
// @access admin, manager, factory-manager
async function updateRawMaterial(req, res, next) {
  try {
    const allowed = ['admin', 'manager', 'factory-manager'];
    if (!allowed.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to edit raw material data' });
    }

    const EDITABLE = ['farmerName', 'village', 'sourceLotCode', 'quantityProduced', 'unit', 'yieldPercent', 'dataSource'];
    const updates  = {};
    for (const key of EDITABLE) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No editable fields provided' });
    }

    // Basic validation
    if (updates.yieldPercent !== undefined) {
      const y = Number(updates.yieldPercent);
      if (isNaN(y) || y < 0 || y > 100) {
        return res.status(400).json({ success: false, error: 'yieldPercent must be 0–100' });
      }
      updates.yieldPercent = y;
    }
    if (updates.quantityProduced !== undefined) {
      const q = Number(updates.quantityProduced);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ success: false, error: 'quantityProduced must be a positive number' });
      }
      updates.quantityProduced = q;
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    // Append a raw material edit entry to noteHistory for full audit trail
    const changedFields = Object.keys(updates).join(', ');
    batch.noteHistory.push({
      note:     `[Raw Material Correction] Fields updated: ${changedFields}`,
      editedBy: req.user?.username || req.user?.name || 'unknown',
      editedAt: new Date(),
    });

    // Apply updates
    Object.assign(batch, updates);
    await batch.save();

    const io = req.app.get('io');
    if (io) io.emit('batch:updated', { batchId: batch._id, batchCode: batch.batchCode });

    res.json({
      success: true,
      message: `Raw material data updated for ${batch.batchCode}`,
      data: enrichBatch(batch),
    });
  } catch (err) { next(err); }
}

// @desc  Get all archived (soft-deleted) batches — admin only
// @route GET /api/batches/archived
// @access admin only
async function getArchivedBatches(req, res, next) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can view archived batches' });
    }

    const batches = await Batch.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .select('-qrCodeDataUrl');

    const enriched = batches.map(enrichBatch);
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) { next(err); }
}

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  recordDispatch,
  updateBatchNote,
  updateRawMaterial,
  getArchivedBatches,
  softDeleteBatch,
  restoreBatch,
  getBatchScans,
};
