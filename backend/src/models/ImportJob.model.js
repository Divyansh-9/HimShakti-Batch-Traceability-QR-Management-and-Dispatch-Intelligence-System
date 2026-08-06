const mongoose = require('mongoose');

/**
 * ImportJob — audit record for one bulk-import run.
 *
 * A job is created by the first commit chunk and updated by every chunk that
 * follows, so a 5,000-row file is one job row in the history table even though
 * it crossed the wire as 10 separate requests.
 *
 * Rollback never hard-deletes. It soft-deletes the batches this job inserted
 * (isDeleted + deleteNote), which keeps them visible in the Archived tab and
 * preserves the traceability trail a regulated food system depends on.
 */
const ImportJobSchema = new mongoose.Schema({

  // ── Source ─────────────────────────────────────────────────────────
  fileName: { type: String, required: true, trim: true },
  entity: {
    type: String,
    required: true,
    enum: ['batch'],
    default: 'batch',
  },

  // ── Progress ───────────────────────────────────────────────────────
  status: {
    type: String,
    required: true,
    enum: ['running', 'done', 'failed', 'rolled_back'],
    default: 'running',
    index: true,
  },
  totalRows:    { type: Number, default: 0 },  // declared by the client up front
  processedRows:{ type: Number, default: 0 },

  // ── Outcome counters (mirrors the INS / UPD / SKIP / ERR column) ────
  inserted: { type: Number, default: 0 },
  updated:  { type: Number, default: 0 },  // always 0 today — dedupe policy is skip-not-upsert
  skipped:  { type: Number, default: 0 },
  errored:  { type: Number, default: 0 },

  /**
   * Batches this job inserted, in insertion order. This is the rollback
   * manifest — without it we cannot tell an imported batch apart from one
   * created by hand in the same minute.
   */
  insertedBatchIds: [{ type: mongoose.Schema.Types.ObjectId, index: true }],

  /**
   * Row-level failures, capped so a catastrophically bad file cannot grow a
   * single document past Mongo's 16 MB ceiling.
   *
   * Named rowErrors, not errors: `errors` is a reserved Mongoose document
   * path (it holds validation state) and declaring it shadows that.
   */
  rowErrors: [{
    row:     { type: Number, required: true },  // 1-based, matches the sheet
    field:   { type: String, default: null },
    message: { type: String, required: true },
  }],
  rowErrorsTruncated: { type: Boolean, default: false },

  // ── Audit ──────────────────────────────────────────────────────────
  createdBy:     { type: String, required: true, trim: true },
  createdByRole: { type: String, default: null },
  finishedAt:    { type: Date,   default: null },

  rolledBackAt:  { type: Date,   default: null },
  rolledBackBy:  { type: String, default: null },

}, { timestamps: true });

// History list is always "newest first" — index the sort key.
ImportJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportJob', ImportJobSchema);
