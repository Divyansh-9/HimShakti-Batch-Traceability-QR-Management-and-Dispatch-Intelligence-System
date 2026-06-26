// shared/schemas/product.schema.js
// OWNED BY: Both interns — any change requires written agreement with 24hr notice
// PURPOSE: Single source of truth for the 'products' collection field contract
// LAST UPDATED: 2026-06-25 — aligned with Intern 2 Week 4 implementation
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  Intern 1 WRITES this collection. Intern 2 READS ONLY. Never write. │
// └─────────────────────────────────────────────────────────────────────┘

const PRODUCT_SCHEMA = {
  _id:                      'ObjectId',     // Primary key
  productName:              'String',       // e.g. "Traditional Mango Pickle" — REQUIRED by Intern 2
  sku:                      'String',       // e.g. "HS-MNG-PCK-01"            — REQUIRED by Intern 2
  category:                 'String',       // "snack" | "juice" | "pickle"
  unitSize:                 'String',       // e.g. "200g Pouch"
  baseShelfLifeDays:        'Number',       // REQUIRED by Intern 2 (fallback expiry source)
  predictedShelfLifeDays:   'Number|null',  // Written by Intern 1 ML — null if not yet predicted
  predictedExpiryTemplate:  'String',       // e.g. "Best Before {days} Days from Packing"
  riskLevel:                'String|null',  // "LOW" | "MEDIUM" | "HIGH" | null — affects FEFO score
  isActive:                 'Boolean',      // REQUIRED — Intern 2 filters on isActive: true
  createdAt:                'Date',
  updatedAt:                'Date'
};

// Fields Intern 2 reads and their criticality:
// baseShelfLifeDays      → CRITICAL — fallback expiry without ML prediction
// predictedShelfLifeDays → IMPORTANT — primary expiry source when present
// riskLevel              → IMPORTANT — used in FEFO priority score formula
// isActive               → CRITICAL — only active products shown in batch creation form
// productName + sku      → CRITICAL — denormalized into batch records at creation time

module.exports = PRODUCT_SCHEMA;
