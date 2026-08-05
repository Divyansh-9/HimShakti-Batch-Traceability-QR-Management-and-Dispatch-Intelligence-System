/**
 * Inspection.model.js
 *
 * Records a Quality Inspector's assessment of a batch.
 *
 * Design decisions:
 *  - Kept separate from Batch for clean domain separation + efficient indexing
 *  - One batch can have multiple inspections (re-inspection after remediation)
 *  - isLatest: true flags the most recent one for quick display
 *  - 30-day TTL via createdAt index — older records auto-expire
 *  - No updates allowed — inspections are append-only for audit integrity
 */
const mongoose = require('mongoose');

// Standard checklist items applied to every inspection.
// Inspectors mark each item passed/failed and add optional notes.
const DEFAULT_CHECKLIST = [
  { label: 'Packaging integrity',       passed: null, note: '' },
  { label: 'Label accuracy & legibility', passed: null, note: '' },
  { label: 'Expiry date visible & correct', passed: null, note: '' },
  { label: 'Weight / quantity correct', passed: null, note: '' },
  { label: 'No visible contamination',  passed: null, note: '' },
  { label: 'Colour & texture acceptable', passed: null, note: '' },
  { label: 'Odour within acceptable range', passed: null, note: '' },
  { label: 'Storage conditions met',    passed: null, note: '' },
];

const checklistItemSchema = new mongoose.Schema({
  label:  { type: String, required: true },
  passed: { type: Boolean, default: null }, // null = not assessed
  note:   { type: String, default: '', maxlength: 200 },
}, { _id: false });

const inspectionSchema = new mongoose.Schema({

  // Link to batch
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  batchCode:   { type: String, required: true, uppercase: true, trim: true, index: true },
  productName: { type: String, required: true, trim: true },
  sku:         { type: String, required: true, uppercase: true },

  // Verdict
  status: {
    type:     String,
    enum:     ['PASSED', 'FAILED', 'FLAGGED'],
    required: true,
    index:    true,
  },
  // 1 = very poor … 5 = excellent
  rating: {
    type:     Number,
    required: true,
    min:      [1, 'Rating must be at least 1'],
    max:      [5, 'Rating cannot exceed 5'],
  },

  // Structured checklist results
  checklist: {
    type:    [checklistItemSchema],
    default: () => DEFAULT_CHECKLIST.map(item => ({ ...item })),
  },

  // Free-text findings + recommendation
  findings:       { type: String, default: '', trim: true, maxlength: 1000 },
  recommendation: { type: String, default: '', trim: true, maxlength: 400 },

  // Who performed the inspection
  inspectedBy: {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:     { type: String, required: true },
    username: { type: String, required: true },
  },

  // Latest flag — true on the most recent inspection per batch
  isLatest: { type: Boolean, default: true, index: true },

  // 30-day TTL — old inspection records auto-expire
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },

}, {
  timestamps: false, // createdAt managed above with TTL
});

// Compound indexes for efficient listing
inspectionSchema.index({ batchId: 1, createdAt: -1 });
inspectionSchema.index({ 'inspectedBy.userId': 1, createdAt: -1 });
inspectionSchema.index({ status: 1, isLatest: 1, createdAt: -1 });

module.exports = mongoose.models.Inspection || mongoose.model('Inspection', inspectionSchema);
