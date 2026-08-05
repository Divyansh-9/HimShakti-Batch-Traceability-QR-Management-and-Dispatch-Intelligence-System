/**
 * inspection.controller.js
 *
 * REST handlers for quality inspection records.
 *
 * POST   /api/inspections              — submit a new inspection (QI only)
 * GET    /api/inspections              — list all inspections (latest per batch, paginated)
 * GET    /api/inspections/batch/:batchId — full history for one batch
 * GET    /api/inspections/my           — current QI's own submissions
 * GET    /api/inspections/:id          — single inspection detail
 *
 * Design:
 *  - Append-only (no update, no delete — audit integrity)
 *  - On each new inspection for a batch, previous isLatest docs are cleared atomically
 *  - T-063: notifyRoles(['manager', 'admin'], 'inspection_completed') after persist
 */
const mongoose  = require('mongoose');
const Batch      = require('../models/Batch.model');
const Inspection = require('../models/Inspection.model');
const { notifyRoles } = require('../services/notificationService');

// ─────────────────────────────────────────────────────────────────
// POST /api/inspections
// Submit a new inspection record for a batch
// ─────────────────────────────────────────────────────────────────
async function createInspection(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { batchId, status, rating, checklist, findings, recommendation } = req.body;

    // Validate required fields
    if (!batchId)                        return res.status(400).json({ success: false, error: 'batchId is required' });
    if (!['PASSED', 'FAILED', 'FLAGGED'].includes(status))
                                         return res.status(400).json({ success: false, error: 'status must be PASSED, FAILED, or FLAGGED' });
    if (!rating || rating < 1 || rating > 5)
                                         return res.status(400).json({ success: false, error: 'rating must be 1–5' });

    // Verify batch exists and is not dispatched/deleted
    const batch = await Batch.findById(batchId).lean().session(session);
    if (!batch || batch.isDeleted)       return res.status(404).json({ success: false, error: 'Batch not found' });
    if (batch.status === 'DISPATCHED')   return res.status(409).json({ success: false, error: 'Cannot inspect a dispatched batch' });

    // Clear previous isLatest flag for this batch
    await Inspection.updateMany(
      { batchId: batch._id, isLatest: true },
      { $set: { isLatest: false } },
      { session }
    );

    // Create new inspection record
    const [inspection] = await Inspection.create([{
      batchId:     batch._id,
      batchCode:   batch.batchCode,
      productName: batch.productName,
      sku:         batch.sku,
      status,
      rating:       Number(rating),
      checklist:    Array.isArray(checklist) ? checklist : undefined,
      findings:     findings     || '',
      recommendation: recommendation || '',
      inspectedBy: {
        userId:   req.user._id,
        name:     req.user.name || req.user.username,
        username: req.user.username,
      },
      isLatest: true,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // T-063: notify managers + admins (fire-and-forget)
    const verdictLabel = status === 'PASSED' ? '✅ Passed' : status === 'FAILED' ? '❌ Failed' : '⚠️ Flagged';
    notifyRoles(req.app, ['manager', 'admin'], {
      type:    'inspection_completed',
      title:   'Inspection submitted',
      message: `${req.user.name || req.user.username} inspected batch ${batch.batchCode} (${batch.productName}) — ${verdictLabel}. Rating: ${rating}/5.${findings ? ' Note: ' + findings.slice(0, 80) : ''}`,
      refId:   batch.batchCode,
      refType: 'inspection',
      triggeredBy: {
        userId: req.user._id,
        name:   req.user.name || req.user.username,
        role:   req.user.role,
      },
    });

    // Optionally emit socket event for live batch list updates
    const io = req.app.get('io');
    if (io) {
      io.emit('inspection:created', {
        batchId:   batch._id,
        batchCode: batch.batchCode,
        status,
        rating,
        inspectedBy: inspection.inspectedBy.name,
      });
    }

    res.status(201).json({
      success: true,
      message: `Inspection submitted — Batch ${batch.batchCode} ${verdictLabel}`,
      data:    inspection,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/inspections
// All latest inspections (one per batch), newest first, paginated
// ─────────────────────────────────────────────────────────────────
async function listInspections(req, res, next) {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const filter = { isLatest: true };
    if (status) filter.status = status.toUpperCase();

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inspection.countDocuments(filter);
    const docs  = await Inspection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, total, page: parseInt(page), count: docs.length, data: docs });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/inspections/my
// The authenticated QI's own submissions (latest + history, paginated)
// ─────────────────────────────────────────────────────────────────
async function myInspections(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const filter = { 'inspectedBy.userId': req.user._id };

    const total = await Inspection.countDocuments(filter);
    const docs  = await Inspection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, total, page: parseInt(page), count: docs.length, data: docs });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/inspections/batch/:batchId
// Full inspection history for a single batch
// ─────────────────────────────────────────────────────────────────
async function getByBatch(req, res, next) {
  try {
    const docs = await Inspection.find({ batchId: req.params.batchId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/inspections/:id
// Single inspection record detail
// ─────────────────────────────────────────────────────────────────
async function getById(req, res, next) {
  try {
    const doc = await Inspection.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Inspection not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
}

module.exports = { createInspection, listInspections, myInspections, getByBatch, getById };
