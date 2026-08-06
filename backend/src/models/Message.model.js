const mongoose = require('mongoose');

/**
 * Message — one collection backing two very different conversations.
 *
 *  scope: 'record'   A comment attached to a batch or an inspection. This is
 *                    audit evidence: it explains why an operational decision
 *                    was taken, it is surfaced next to the record it concerns,
 *                    and it never expires and is never hard-deleted.
 *
 *  scope: 'channel'  Role chatter — shift handover, coordination. Operational
 *                    noise rather than evidence, so it ages out.
 *
 * They share a collection because they share a shape (author, body, edits,
 * read state) and every query is already discriminated by `scope`. Splitting
 * them would duplicate the moderation and pagination code for no benefit.
 *
 * ── Retention ───────────────────────────────────────────────────────────
 * `expiresAt` is a TTL index. It is set to a date for channel messages and
 * left null for record comments — MongoDB's TTL monitor ignores documents
 * whose indexed field is null, so one index serves both without a partial
 * filter. Getting this backwards would silently delete audit evidence, which
 * is why the value is computed in one place (see `expiresAtFor` below) rather
 * than at each call site.
 */

// Role channels keep 90 days. Long enough to reconstruct a bad week, short
// enough that chatter does not accumulate forever.
const CHANNEL_RETENTION_DAYS = 90;

const MessageSchema = new mongoose.Schema({

  scope: {
    type: String,
    required: true,
    enum: ['record', 'channel'],
    index: true,
  },

  // ── Where it belongs ───────────────────────────────────────────────
  /** scope 'record': 'batch' | 'inspection'. scope 'channel': null. */
  refType: {
    type: String,
    enum: ['batch', 'inspection', null],
    default: null,
  },
  /** scope 'record': the document's ObjectId. scope 'channel': null. */
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  /**
   * scope 'channel': the role whose channel this is, e.g. 'factory-manager'.
   * scope 'record': null.
   *
   * There is deliberately no 'global' channel. Untethered company-wide chat
   * duplicates the tools the team already has and pulls operational decisions
   * out of the audit trail; conversation that matters belongs on the record.
   */
  channelRole: {
    type: String,
    enum: ['admin', 'manager', 'factory-manager', 'quality-inspector', 'dispatch-coordinator', null],
    default: null,
    index: true,
  },

  // ── Content ────────────────────────────────────────────────────────
  body: {
    type: String,
    required: [true, 'Message body is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },

  // ── Author (denormalized, like batches — the message must still read
  //    correctly after a rename or a role change) ─────────────────────
  authorId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  authorName: { type: String, required: true, trim: true },
  authorRole: { type: String, required: true },

  // ── Edit trail. Bodies are never overwritten in place: the previous
  //    text is pushed here first, so an edited comment cannot be used to
  //    rewrite history. ────────────────────────────────────────────────
  editHistory: [{
    body:     { type: String, required: true },
    editedAt: { type: Date,   default: Date.now },
  }],
  editedAt: { type: Date, default: null },

  // ── Soft delete, same as everything else in this system ────────────
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date,   default: null },
  deletedBy: { type: String, default: null },

  /** Null = keep forever. A date = TTL deletes it then. */
  expiresAt: { type: Date, default: null },

}, { timestamps: true });

// Thread reads: every comment on one record, oldest first.
MessageSchema.index({ scope: 1, refType: 1, refId: 1, createdAt: 1 });
// Channel reads: newest first, paged.
MessageSchema.index({ scope: 1, channelRole: 1, createdAt: -1 });
// Retention. expireAfterSeconds: 0 means "delete when expiresAt passes";
// documents with a null expiresAt are never considered.
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Retention date for a scope. Single source of truth — the one place that
 * decides whether a message is evidence or chatter.
 */
MessageSchema.statics.expiresAtFor = function expiresAtFor(scope) {
  if (scope !== 'channel') return null;   // record comments are permanent
  return new Date(Date.now() + CHANNEL_RETENTION_DAYS * 24 * 60 * 60 * 1000);
};

MessageSchema.statics.CHANNEL_RETENTION_DAYS = CHANNEL_RETENTION_DAYS;

module.exports = mongoose.model('Message', MessageSchema);
