const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    signerEmail: {
      type: String,
      required: true,
    },
    signerName: {
      type: String,
      default: '',
    },
    // Position as percentage of page dimensions for responsive rendering
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      default: 20, // percentage of page width
    },
    height: {
      type: Number,
      default: 5, // percentage of page height
    },
    page: {
      type: Number,
      required: true,
      default: 1,
    },
    type: {
      type: String,
      enum: ['text', 'draw', 'image'],
      default: 'text',
    },
    signatureData: {
      type: String, // base64 data for drawn/image signatures, or text content
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'signed', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // Extra display metadata (e.g. { font: 'font-signature-1' } for text signatures)
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    signedAt: {
      type: Date,
    },
    inviteSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups by document
signatureSchema.index({ document: 1 });
signatureSchema.index({ signer: 1 });

module.exports = mongoose.model('Signature', signatureSchema);
