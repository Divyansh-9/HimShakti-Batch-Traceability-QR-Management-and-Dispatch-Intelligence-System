const mongoose = require('mongoose');
const Batch      = require('../models/Batch.model');
const ScanEvent  = require('../models/ScanEvent.model');
const { calculateExpiry, getBatchStatus, calculatePriorityScore } = require('../services/expiryCalculator');
const { generateBatchCode } = require('../utils/batchCodeGenerator');
const { generateBatchQR }   = require('../services/qrGenerator');
const { assertProductContract } = require('../utils/productContract');

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
      createdBy: req.user?.name || 'manager'
    });

    // Emit real-time event so all connected dashboards update immediately
    const io = req.app.get('io');
    if (io) io.emit('batch:created', { ...batch.toObject(), daysUntilExpiry });

    res.status(201).json({
      success: true,
      message: `Batch ${batchCode} created successfully`,
      data: { ...batch.toObject(), daysUntilExpiry }
    });
  } catch (err) { next(err); }
}

async function getAllBatches(req, res, next) {
  try {
    const { status, sku, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (sku)    filter.sku    = sku.toUpperCase();

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Batch.countDocuments(filter);

    const batches = await Batch.find(filter)
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-qrCodeDataUrl');

    const now      = new Date();
    const enriched = batches.map(b => {
      const days = Math.ceil((new Date(b.expiryDate) - now) / 86400000);
      return { ...b.toObject(), daysUntilExpiry: days };
    });

    res.json({ success: true, total, page: parseInt(page), count: enriched.length, data: enriched });
  } catch (err) { next(err); }
}

async function getBatchById(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    const days = Math.ceil((new Date(batch.expiryDate) - new Date()) / 86400000);
    res.json({ success: true, data: { ...batch.toObject(), daysUntilExpiry: days } });
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

    // Emit real-time status change to all connected dashboards
    const io = req.app.get('io');
    if (io) io.emit('batch:updated', { batchId: batch._id, batchCode: batch.batchCode, status: 'DISPATCHED' });

    res.json({ success: true, message: `Batch ${batch.batchCode} marked as DISPATCHED`, data: batch });
  } catch (err) { next(err); }
}

// @desc  Scan analytics for a batch (Idea 3)
// @route GET /api/batches/:id/scans
async function getBatchScans(req, res, next) {
  try {
    const batch = await Batch.findById(req.params.id).select('batchCode');
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const events = await ScanEvent.find({ batchCode: batch.batchCode })
      .sort({ scannedAt: -1 })
      .select('scannedAt deviceType source');

    const mobileCount  = events.filter(e => e.deviceType === 'mobile').length;
    const desktopCount = events.filter(e => e.deviceType === 'desktop').length;

    res.json({
      success:    true,
      batchCode:  batch.batchCode,
      totalScans: events.length,
      lastScanAt: events[0]?.scannedAt || null,
      breakdown:  { mobile: mobileCount, desktop: desktopCount }
    });
  } catch (err) { next(err); }
}

module.exports = { createBatch, getAllBatches, getBatchById, recordDispatch, getBatchScans };
