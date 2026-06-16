const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'document_created',
        'document_deleted',
        'document_downloaded',
        'document_shared',
        'signature_added',
        'signature_signed',
        'signature_rejected',
        'signature_deleted',
        'invite_sent',
      ],
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    // Optional: name/email for public (unauthenticated) signers
    actorName: {
      type: String,
      default: '',
    },
    actorEmail: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
auditLogSchema.index({ document: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
