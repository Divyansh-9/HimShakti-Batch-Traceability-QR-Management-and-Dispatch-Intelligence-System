const mongoose = require('mongoose');

async function getProducts(req, res, next) {
  try {
    const products = await mongoose.connection.db
      .collection('products')
      .find({ isActive: true })
      .project({
        productName: 1, sku: 1, category: 1, unitSize: 1,
        baseShelfLifeDays: 1, predictedShelfLifeDays: 1,
        riskLevel: 1, predictedExpiryTemplate: 1
      })
      .toArray();
    res.json({ success: true, count: products.length, data: products });
  } catch (err) { next(err); }
}

async function getProductById(req, res, next) {
  try {
    const product = await mongoose.connection.db
      .collection('products')
      .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

module.exports = { getProducts, getProductById };
