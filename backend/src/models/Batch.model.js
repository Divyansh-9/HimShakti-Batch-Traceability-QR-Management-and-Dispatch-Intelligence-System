const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({

  // Link to Intern 1's product
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'productId is required'],
    index: true
  },

  // Denormalized product snapshot (never changes after creation)
  productName: { type: String, required: true, trim: true },
  sku:         { type: String, required: true, trim: true, uppercase: true },

  // Raw Material Source (traceability)
  sourceLotCode: { type: String, required: [true, 'Source lot code is required'], trim: true, uppercase: true },
  farmerName:    { type: String, required: [true, 'Farmer name is required'], trim: true },
  village:       { type: String, required: [true, 'Village is required'], trim: true },

  // Production Data
  quantityProduced: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  unit: {
    type: String,
    required: true,
    enum: ['Kg', 'Units', 'Liters']
  },
  yieldPercent: {
    type: Number,
    required: true,
    min: [0, 'Yield cannot be below 0'],
    max: [100, 'Yield cannot exceed 100']
  },

  // Batch Identity
  batchCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
    // Format: HS-YYYY-MM-NNN e.g. HS-2026-06-001
  },

  // Dates
  packDate:   { type: Date, required: true },
  expiryDate: { type: Date, required: true },

  // Shelf Life Source (FR-1.2)
  dataSource: {
    type: String,
    required: true,
    enum: ['predicted', 'fallback']
  },
  shelfLifeSource: {
    type: String,
    required: true,
    enum: ['predicted', 'base', 'manual']
  },

  // Status and Priority
  status: {
    type: String,
    required: true,
    enum: ['READY', 'WARNING', 'URGENT', 'DISPATCHED', 'EXPIRED'],
    default: 'READY'
  },
  priorityScore: {
    type: Number,
    required: true,
    default: 0
  },

  // QR Code
  qrCodeDataUrl: { type: String, required: true },
  qrAbsoluteUrl: { type: String, required: true },

  // ── Public trace token ────────────────────────────────────────────
  // Opaque identifier the QR encodes, so the public trace URL does not
  // expose the sequential batch code. Derived (HMAC), not random — see
  // utils/traceToken.js. Sparse because batches created before this
  // field existed are backfilled by script, not at read time.
  traceToken: { type: String, default: null, index: true, sparse: true },

  // ── Quality check snapshot ────────────────────────────────────────
  // Denormalized from the latest Inspection at the moment it is filed.
  // Inspection documents carry a 30-day TTL, so reading through to the
  // Inspection collection would make a batch's quality history silently
  // vanish a month after it was verified — exactly when a consumer
  // scanning a shelf-stable product is most likely to look. Snapshotting
  // follows the same reasoning as productName/farmerName above: a batch
  // must keep showing what was true at production time.
  qualityCheck: {
    status:       { type: String, enum: ['PASSED', 'FAILED', 'FLAGGED', null], default: null },
    rating:       { type: Number, min: 1, max: 5, default: null },
    inspectedAt:  { type: Date, default: null },
    inspectorName:{ type: String, default: null },
  },

  // Dispatch Info
  dispatchDate: { type: Date, default: null },
  buyerName:    { type: String, default: null, trim: true },

  // Audit
  traceabilityNote: { type: String, required: true, trim: true },
  createdBy:        { type: String, required: true, trim: true },

  // ── Traceability Note History (append-only audit log of edits) ──
  noteHistory: [{
    note:     { type: String, required: true },
    editedBy: { type: String, required: true },
    editedAt: { type: Date,   default: Date.now },
  }],

  // ── Soft Delete (never hard-delete traceability records) ──────────
  isDeleted:  { type: Boolean, default: false, index: true },
  deletedAt:  { type: Date,   default: null },
  deletedBy:  { type: String, default: null },
  deleteNote: { type: String, default: null },  // reason for deletion

}, { timestamps: true });

BatchSchema.index({ status: 1, expiryDate: 1 });
BatchSchema.index({ sku: 1 });
// Compound index for "active batches only" — the most common list query
BatchSchema.index({ isDeleted: 1, status: 1, expiryDate: 1 });

module.exports = mongoose.model('Batch', BatchSchema);
