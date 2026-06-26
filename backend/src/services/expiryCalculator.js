const { assertProductContract } = require('../utils/productContract');

function calculateExpiry(product, packDate) {
  assertProductContract(product);

  const hasPrediction   = product.predictedShelfLifeDays != null;
  const shelfLifeDays   = hasPrediction ? product.predictedShelfLifeDays : product.baseShelfLifeDays;
  const dataSource      = hasPrediction ? 'predicted' : 'fallback';
  const shelfLifeSource = hasPrediction ? 'predicted' : 'base';

  const expiryDate = new Date(packDate);
  expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);

  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

  return { expiryDate, daysUntilExpiry, shelfLifeDays, dataSource, shelfLifeSource };
}

// FR-3.2: Dynamic status recalculation on retrieval
function getBatchStatus(daysUntilExpiry) {
  if (daysUntilExpiry <= 0)  return 'EXPIRED';
  if (daysUntilExpiry <= 7)  return 'URGENT';
  if (daysUntilExpiry <= 30) return 'WARNING';
  return 'READY';
}

// Priority score for FEFO: higher = dispatch first
function calculatePriorityScore(daysUntilExpiry, riskLevel) {
  let score = Math.max(0, 365 - daysUntilExpiry);
  if (riskLevel === 'HIGH')   score += 100;
  if (riskLevel === 'MEDIUM') score += 50;
  return score;
}

module.exports = { calculateExpiry, getBatchStatus, calculatePriorityScore };
