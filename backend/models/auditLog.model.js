const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'APPROVE_PROPERTY',
        'REJECT_PROPERTY',
        'DELETE_PROPERTY',
        'BAN_USER',
        'UNBAN_USER',
        'BAN_OWNER',
        'UNBAN_OWNER',
        'ADMIN_LOGIN',
        'ADMIN_REGISTER',
      ],
    },
    targetType: {
      type: String,
      enum: ['Property', 'User', 'Owner'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
