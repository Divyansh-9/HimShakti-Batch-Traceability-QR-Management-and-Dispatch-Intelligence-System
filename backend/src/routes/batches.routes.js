const router = require('express').Router();
const {
  createBatch, getAllBatches, getBatchById,
  recordDispatch, updateBatchNote, softDeleteBatch,
  restoreBatch, getBatchScans
} = require('../controllers/batches.controller');
const { protect } = require('../middleware/auth');

// ── Public reads ─────────────────────────────────────────────────────
router.get('/',          getAllBatches);
router.get('/:id',       getBatchById);
router.get('/:id/scans', getBatchScans);

// Lightweight QR endpoint — returns only qrCodeDataUrl (avoids huge base64 in list view)
router.get('/:id/qr', async (req, res, next) => {
  try {
    const Batch = require('../models/Batch.model');
    const batch = await Batch.findById(req.params.id).select('batchCode qrCodeDataUrl qrAbsoluteUrl');
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: { batchCode: batch.batchCode, qrCodeDataUrl: batch.qrCodeDataUrl, qrAbsoluteUrl: batch.qrAbsoluteUrl } });
  } catch (err) { next(err); }
});

// ── Protected writes ─────────────────────────────────────────────────
router.post('/',                  protect, createBatch);
router.patch('/:id/dispatch',     protect, recordDispatch);

// Note editing — admin, manager, factory-manager (enforced in controller)
router.patch('/:id/note',         protect, updateBatchNote);

// Soft delete & restore — admin only (enforced in controller)
router.delete('/:id',             protect, softDeleteBatch);
router.patch('/:id/restore',      protect, restoreBatch);

module.exports = router;
