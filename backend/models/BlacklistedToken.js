const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// TTL index for automatic cleanup
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.BlacklistedToken || mongoose.model('BlacklistedToken', blacklistedTokenSchema);

