const router = require('express').Router();
const { createBatch, getAllBatches, getBatchById, recordDispatch, getBatchScans } = require('../controllers/batches.controller');
const { protect } = require('../middleware/auth');
router.get('/',                    getAllBatches);
router.get('/:id',                 getBatchById);
router.get('/:id/scans',           getBatchScans);
router.post('/',        protect,   createBatch);
router.patch('/:id/dispatch', protect, recordDispatch);

// Lightweight QR data endpoint — returns only qrCodeDataUrl to avoid sending huge base64 in list view
router.get('/:id/qr', async (req, res, next) => {
  try {
    const Batch = require('../models/Batch.model');
    const batch = await Batch.findById(req.params.id).select('batchCode qrCodeDataUrl qrAbsoluteUrl');
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: { batchCode: batch.batchCode, qrCodeDataUrl: batch.qrCodeDataUrl, qrAbsoluteUrl: batch.qrAbsoluteUrl } });
  } catch (err) { next(err); }
});

module.exports = router;
