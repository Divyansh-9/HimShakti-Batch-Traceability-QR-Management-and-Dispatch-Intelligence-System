require('dotenv').config();
const mongoose = require('mongoose');
const Batch = require('../models/Batch.model');
const { generateBatchCode } = require('../utils/batchCodeGenerator');
const { calculateExpiry, getBatchStatus, calculatePriorityScore } = require('../services/expiryCalculator');

async function seedBatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Get a product
    const product = await mongoose.connection.db.collection('products').findOne({});
    if (!product) {
      console.log('No products found to seed batch. Ask Intern 1 to seed products.');
      process.exit(1);
    }

    const packDate = new Date();
    const { expiryDate, daysUntilExpiry, dataSource, shelfLifeSource } = calculateExpiry(product, packDate);
    const batchCode = await generateBatchCode();
    const status = getBatchStatus(daysUntilExpiry);
    const priorityScore = calculatePriorityScore(daysUntilExpiry, product.riskLevel);

    const batch = await Batch.create({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      sourceLotCode: 'TEST-LOT-001',
      farmerName: 'Test Farmer',
      village: 'Test Village',
      quantityProduced: 100,
      unit: 'Kg',
      yieldPercent: 95,
      batchCode,
      packDate,
      expiryDate,
      dataSource,
      shelfLifeSource,
      status,
      priorityScore,
      qrCodeDataUrl: 'data:image/png;base64,TEST',
      qrAbsoluteUrl: `${process.env.PUBLIC_BASE_URL}/trace/${batchCode}`,
      traceabilityNote: 'Test Batch',
      createdBy: 'manager'
    });

    console.log('✅ Test Batch created:', batch.batchCode);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding batch:', err);
    process.exit(1);
  }
}

seedBatch();
