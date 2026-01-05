const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedBy: {
      type: String, // Admin's shop name
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Super Admin who completed the reset
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes
passwordResetRequestSchema.index({ userId: 1, status: 1 });
passwordResetRequestSchema.index({ status: 1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

