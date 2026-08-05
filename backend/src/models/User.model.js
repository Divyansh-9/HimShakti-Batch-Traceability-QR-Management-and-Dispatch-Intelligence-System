const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, default: '', lowercase: true, trim: true },
  phone:        { type: String, default: '' },
  preferences: {
    mode:    { type: String, default: 'dark' },
    palette: { type: String, default: 'default' },
    accent:  { type: String, default: 'auto' },
  },
  // Linked Google account email — optional, set via 'Link Google Account' in dashboard
  googleEmail:  { type: String, default: null, lowercase: true, trim: true, sparse: true },
  googleLinkedAt: { type: Date, default: null },
  role: {
    type:    String,
    enum:    ['admin', 'manager', 'factory-manager', 'quality-inspector', 'dispatch-coordinator'],
    default: 'factory-manager',
  },
  isActive:       { type: Boolean, default: true },

  // ── Tier 0: Super Admin guard ─────────────────────────────────────
  // Immutable flag — identifies the one true Super Admin (Divyansh).
  // Can only be set via setSuperAdmin.js migration script or Atlas console.
  // No API endpoint can set this to true — enforced server-side.
  isSuperAdmin:   { type: Boolean, default: false },

  // ── Soft-Delete (Recycle Bin) ─────────────────────────────────────
  // When an Admin deletes a user, isDeleted is set to true.
  // The user disappears from all views except the Super Admin's Deleted Users panel.
  // Super Admin can restore (undo) or permanently hard-delete from there.
  isDeleted:      { type: Boolean, default: false },
  deletedBy:      { type: String,  default: null },   // username of who deleted
  deletedAt:      { type: Date,    default: null },
  deleteNote:     { type: String,  default: null },   // optional reason

  // ── Role Promotion Audit Trail ────────────────────────────────────
  // Records who last changed this user's role and when.
  promotedBy:     { type: String,  default: null },   // username of promoting admin
  promotedAt:     { type: Date,    default: null },
  previousRole:   { type: String,  default: null },   // role before the last change

  // Email verification via OTP (set during account activation)
  emailVerified:  { type: Boolean, default: false },
  otpCode:        { type: String,  default: null },   // 6-digit hashed OTP
  otpExpiry:      { type: Date,    default: null },   // OTP valid for 10 minutes
  otpAttempts:    { type: Number,  default: 0 },      // lock after 5 wrong guesses

  // Password-reset token (short-lived JWT id stored here for single-use invalidation)
  resetToken:       { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },
}, { timestamps: true });

// Compare plain password against stored hash
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
