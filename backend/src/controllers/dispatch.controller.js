const Batch = require('../models/Batch.model');
const { getBatchStatus } = require('../services/expiryCalculator');

async function getFEFOQueue(req, res, next) {
  try {
    const { category } = req.query;
    const filter = { status: { $in: ['READY', 'WARNING', 'URGENT'] } };
    if (category) filter.category = category;

    const batches = await Batch.find(filter).select('-qrCodeDataUrl').lean();
    const now     = new Date();

    const enriched = batches.map(b => {
      const days       = Math.ceil((new Date(b.expiryDate) - now) / 86400000);
      const liveStatus = getBatchStatus(days);
      return { ...b, daysUntilExpiry: days, liveStatus };
    });

    const priority = { URGENT: 0, WARNING: 1, READY: 2 };
    enriched.sort((a, b) => {
      const pd = (priority[a.liveStatus] ?? 3) - (priority[b.liveStatus] ?? 3);
      if (pd !== 0) return pd;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    res.json({
      success: true,
      count: enriched.length,
      dispatchStrategy: 'FEFO — First Expired, First Out',
      data: enriched
    });
  } catch (err) { next(err); }
}

module.exports = { getFEFOQueue };
