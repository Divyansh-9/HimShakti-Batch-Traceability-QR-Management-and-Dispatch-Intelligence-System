const mongoose = require('mongoose');

const ScanEventSchema = new mongoose.Schema({

  batchId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  batchCode: { type: String, required: true },

  scannedAt: { type: Date, default: Date.now },

  source: {
    type: String,
    required: true,
    enum: ['factory', 'buyer', 'QA'],
    default: 'factory'
  },

  deviceType: {
    type: String,
    required: true,
    enum: ['Mobile', 'Tablet', 'Desktop', 'Unknown'],
    default: 'Unknown'
  },

  // IP hashed before storage — never stored in plain text (NFR-2.3)
  ipHash: { type: String, required: true }

}, { timestamps: true });

ScanEventSchema.index({ batchId: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanEvent', ScanEventSchema);
