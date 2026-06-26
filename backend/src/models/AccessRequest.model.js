const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  // unique: true prevents duplicate submissions for the same email (Issue 2 fix)
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: {
    type:     String,
    enum:     ['factory-manager', 'quality-inspector', 'dispatch-coordinator', 'admin'],
    required: true,
  },
  status: {
    type:    String,
    enum:    ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  note:         { type: String, default: '' },   // rejection reason
  inviteToken:  { type: String },                // sha256-hashed raw token
  inviteExpiry: { type: Date },
  inviteUsed:   { type: Boolean, default: false },
  approvedBy:   { type: String },                // username of admin who approved
}, { timestamps: true });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
