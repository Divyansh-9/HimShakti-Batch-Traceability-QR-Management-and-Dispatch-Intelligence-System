const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, default: '', lowercase: true, trim: true },
  // Linked Google account email — optional, set via 'Link Google Account' in dashboard
  googleEmail:  { type: String, default: null, lowercase: true, trim: true, sparse: true },
  googleLinkedAt: { type: Date, default: null },
  role: {
    type:    String,
    enum:    ['admin', 'manager', 'factory-manager', 'quality-inspector', 'dispatch-coordinator'],
    default: 'factory-manager',
  },
  isActive:       { type: Boolean, default: true },
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
