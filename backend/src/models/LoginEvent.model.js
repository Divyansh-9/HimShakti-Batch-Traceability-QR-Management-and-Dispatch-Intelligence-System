const mongoose = require('mongoose');

const loginEventSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:    { type: String,   required: true },
  city:        { type: String,   default: 'Unknown' },
  country:     { type: String,   default: 'Unknown' },
  countryCode: { type: String,   default: '' },
  browser:     { type: String,   default: 'Unknown' },
  os:          { type: String,   default: 'Unknown' },
  device:      { type: String,   default: 'desktop' },
  method:      { type: String,   default: 'password' },
  createdAt:   { type: Date,     default: Date.now },
});

// TTL index — MongoDB auto-deletes documents older than 30 days
loginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
// Compound index for efficient per-user queries sorted by time
loginEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LoginEvent', loginEventSchema);
