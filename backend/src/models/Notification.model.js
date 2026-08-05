/**
 * Notification.model.js
 *
 * Stores individual notification events delivered to users.
 * 7-day TTL — MongoDB auto-expires old notifications in the background.
 *
 * One document per notification. Kept separate from User to avoid
 * unbounded document growth and to allow efficient TTL indexing.
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who receives this notification
  recipientRole: {
    type: String,
    enum: ['factory-manager', 'quality-inspector', 'dispatch-coordinator', 'admin', 'super-admin', 'manager'],
    required: true,
    index: true,
  },
  // Optionally target a specific user (null = all users with recipientRole)
  recipientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },

  // Notification type — used for icon/colour selection in the UI
  type: {
    type: String,
    enum: [
      'batch_created',
      'batch_dispatched',
      'inspection_completed',
      'admin_action',
      'system',
    ],
    required: true,
  },

  // Display content
  title:   { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 400 },

  // Reference to the triggering object (batch, user, etc.)
  refId:   { type: String, default: null },  // e.g. batchCode or username
  refType: { type: String, default: null },  // 'batch' | 'user' | 'inspection'

  // Triggered by
  triggeredBy: {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:     { type: String, default: 'System' },
    role:     { type: String, default: null },
  },

  read: { type: Boolean, default: false, index: true },

  // TTL — auto-delete after 7 days
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
}, {
  timestamps: false, // createdAt is managed above with TTL
});

// Compound index: fetch all unread notifications for a role efficiently
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
