const crypto     = require('crypto');
const Batch      = require('../models/Batch.model');
const ScanEvent  = require('../models/ScanEvent.model');
const { getBatchStatus } = require('../services/expiryCalculator');

async function getTraceabilityPage(req, res, next) {
  try {
    const batch = await Batch.findOne({ batchCode: req.params.batchCode.toUpperCase() });
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found. QR code may be invalid.' });

    const now             = new Date();
    const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate) - now) / 86400000);
    const liveStatus      = getBatchStatus(daysUntilExpiry);

    if (batch.status !== liveStatus && batch.status !== 'DISPATCHED') {
      await Batch.findByIdAndUpdate(batch._id, { status: liveStatus });
    }

    const ua = req.headers['user-agent'] || '';
    let deviceType = 'Desktop';
    if (/mobile/i.test(ua))       deviceType = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

    const rawIP  = req.ip || 'unknown';
    const ipHash = crypto.createHash('sha256').update(rawIP + process.env.JWT_SECRET).digest('hex');

    ScanEvent.create({
      batchId: batch._id,
      batchCode: batch.batchCode,
      source: req.query.source || 'factory',
      deviceType,
      ipHash
    }).catch(err => console.error('Scan log error:', err.message));

    res.json({
      success: true,
      data: {
        batchCode:        batch.batchCode,
        productName:      batch.productName,
        sku:              batch.sku,
        farmerName:       batch.farmerName,
        village:          batch.village,
        sourceLotCode:    batch.sourceLotCode,
        packDate:         batch.packDate,
        expiryDate:       batch.expiryDate,
        daysUntilExpiry,
        status:           liveStatus,
        yieldPercent:     batch.yieldPercent,
        unit:             batch.unit,
        quantityProduced: batch.quantityProduced,
        dataSource:       batch.dataSource,
        traceabilityNote: batch.traceabilityNote,
        warning:
          liveStatus === 'URGENT'  ? `⚠️ This batch expires in ${daysUntilExpiry} days. Prioritise dispatch.` :
          liveStatus === 'EXPIRED' ? `🚨 This batch EXPIRED on ${new Date(batch.expiryDate).toDateString()}.` :
          null
      }
    });
  } catch (err) { next(err); }
}

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

module.exports = { getTraceabilityPage, getQRImage };
