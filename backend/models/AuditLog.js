const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['password_reset', 'password_changed', 'role_changed', 'user_deleted', 'user_created']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: {
      type: mongoose.Schema.Types.Mixed // Store additional details like IP, user agent, etc.
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

