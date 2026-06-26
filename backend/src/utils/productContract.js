function assertProductContract(product) {
  if (!product) throw new Error('DB_CONTRACT: product is null');
  if (!product.isActive) throw new Error(`DB_CONTRACT: product "${product.productName}" is inactive`);
  if (!product.productName) throw new Error('DB_CONTRACT: missing productName');
  if (!product.sku) throw new Error('DB_CONTRACT: missing sku');
  if (product.baseShelfLifeDays == null && product.predictedShelfLifeDays == null) {
    throw new Error(`DB_CONTRACT: product "${product.productName}" has no shelf life data. Contact Intern 1.`);
  }
  return true;
}

module.exports = { assertProductContract };
