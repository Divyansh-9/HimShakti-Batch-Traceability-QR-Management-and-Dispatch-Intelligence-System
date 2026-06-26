const router = require('express').Router();
const { createBatch, getAllBatches, getBatchById, recordDispatch, getBatchScans } = require('../controllers/batches.controller');
const { protect } = require('../middleware/auth');
router.get('/',                    getAllBatches);
router.get('/:id',                 getBatchById);
router.get('/:id/scans',           getBatchScans);
router.post('/',        protect,   createBatch);
router.patch('/:id/dispatch', protect, recordDispatch);
module.exports = router;
