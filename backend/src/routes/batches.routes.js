const router = require('express').Router();
const {
  createBatch, getAllBatches, getBatchById,
  recordDispatch, updateBatchNote, updateRawMaterial,
  getArchivedBatches, softDeleteBatch, restoreBatch, getBatchScans
} = require('../controllers/batches.controller');
const { protect } = require('../middleware/auth');

// ── Public reads ─────────────────────────────────────────────────────
router.get('/',          getAllBatches);
router.get('/:id/scans', getBatchScans);

// Lightweight QR endpoint
router.get('/:id/qr', async (req, res, next) => {
  try {
    const Batch = require('../models/Batch.model');
    const batch = await Batch.findById(req.params.id).select('batchCode qrCodeDataUrl qrAbsoluteUrl');
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: { batchCode: batch.batchCode, qrCodeDataUrl: batch.qrCodeDataUrl, qrAbsoluteUrl: batch.qrAbsoluteUrl } });
  } catch (err) { next(err); }
});

// ── Protected reads ──────────────────────────────────────────────────
// IMPORTANT: /archived must come before /:id so Express doesn't treat "archived" as a Mongo ObjectId
router.get('/archived',       protect, getArchivedBatches);
router.get('/:id',            getBatchById);

// ── Protected writes ─────────────────────────────────────────────────
router.post('/',                  protect, createBatch);
router.patch('/:id/dispatch',     protect, recordDispatch);

// Note editing — admin, manager, factory-manager
router.patch('/:id/note',         protect, updateBatchNote);

// Raw material correction — admin, manager, factory-manager
router.patch('/:id/raw-material', protect, updateRawMaterial);

// Soft delete & restore — admin only
router.delete('/:id',             protect, softDeleteBatch);
router.patch('/:id/restore',      protect, restoreBatch);

module.exports = router;
