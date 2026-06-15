// backend/src/db-contracts/productContract.js
// PURPOSE: Validate that products from the shared collection have
//          the fields Intern 2 depends on. Fail loudly, not silently.

function assertProductContract(product) {
  if (!product) throw new Error('DB_CONTRACT: product is null');
  if (typeof product.baseShelfLifeDays === 'undefined') {
    throw new Error(
      `DB_CONTRACT: product "${product.name}" is missing baseShelfLifeDays. ` +
      `Contact Intern 1 to seed this field.`
    );
  }
  return true;
}

module.exports = { assertProductContract };
