const router = require('express').Router();
const { getTraceabilityPage, getQRImage } = require('../controllers/qr.controller');
router.get('/:batchCode',       getTraceabilityPage);
router.get('/:batchCode/image', getQRImage);
module.exports = router;
