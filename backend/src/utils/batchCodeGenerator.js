// Format: HS-YYYY-MM-NNN (per SRS §8.1)
const Batch = require('../models/Batch.model');

async function generateBatchCode() {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `HS-${year}-${month}-`;

  const last = await Batch.findOne(
    { batchCode: { $regex: `^${prefix}` } },
    { batchCode: 1 },
    { sort: { batchCode: -1 } }
  );

  let nextNum = 1;
  if (last) {
    const parts = last.batchCode.split('-');
    nextNum = parseInt(parts[3], 10) + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

module.exports = { generateBatchCode };
