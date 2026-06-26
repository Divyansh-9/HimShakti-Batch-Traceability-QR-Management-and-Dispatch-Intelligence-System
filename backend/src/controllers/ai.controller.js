const Batch = require('../models/Batch.model');
const { runDispatchAudit } = require('../services/aiService');

async function runAudit(req, res, next) {
  try {
    const now     = new Date();
    const batches = await Batch.find({ status: { $in: ['READY', 'WARNING', 'URGENT'] } }).lean();

    if (batches.length === 0) {
      return res.json({ success: true, message: 'No active batches to audit', report: null });
    }

    const enriched = batches.map(b => ({
      ...b,
      daysUntilExpiry: Math.ceil((new Date(b.expiryDate) - now) / 86400000)
    }));

    const result = await runDispatchAudit(enriched);

    res.json({
      success:     true,
      fromCache:   result.fromCache,
      generatedAt: result.generatedAt || result.cachedAt,
      batchCount:  enriched.length,
      report:      result.report
    });
  } catch (err) {
    if (err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'AI Services are rate limited. Please wait and try again.',
        retryAfter: '60 seconds'
      });
    }
    next(err);
  }
}

module.exports = { runAudit };
