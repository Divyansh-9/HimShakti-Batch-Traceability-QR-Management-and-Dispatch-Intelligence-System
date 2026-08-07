const router = require('express').Router();
const { getTraceabilityPage, getTraceByToken, getQRImage } = require('../controllers/qr.controller');

// `/t/:token` MUST be declared before `/:batchCode`, or Express matches
// the literal "t" as a batch code and the token path never resolves.
router.get('/t/:token',         getTraceByToken);
router.get('/:batchCode',       getTraceabilityPage);
router.get('/:batchCode/image', getQRImage);

module.exports = router;
