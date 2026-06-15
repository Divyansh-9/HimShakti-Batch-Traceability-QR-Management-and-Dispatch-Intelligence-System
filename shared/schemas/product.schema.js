// shared/schemas/product.schema.js
// OWNED BY: Both interns — any change requires written agreement
// PURPOSE: Single source of truth for the 'products' collection shape

const PRODUCT_SCHEMA = {
  _id: 'ObjectId',
  name: 'String',           // "Organic Ginger Pickle"
  category: 'String',       // "Pickle" | "Spice" | "Oil"
  baseShelfLifeDays: 'Number',       // REQUIRED by Intern 2
  predictedShelfLifeDays: 'Number',  // OPTIONAL — null if ML not run
  isActive: 'Boolean',
  createdAt: 'Date',
  updatedAt: 'Date'
};

module.exports = PRODUCT_SCHEMA;
