const Signature = require('../models/Signature');
const Document = require('../models/Document');
const User = require('../models/User');
const { logActivity } = require('./auditController');
const { sendSignatureRequest, sendSignatureComplete } = require('../services/emailService');

// @desc    Create a signature field on a document
// @route   POST /api/signatures
// @access  Private
const createSignature = async (req, res) => {
  try {
    const { documentId, x, y, width, height, page, type } = req.body;

    // Validate document exists and user has access
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add signatures to this document',
      });
    }

    const signature = await Signature.create({
      document: documentId,
      signer: req.user._id,
      signerEmail: req.user.email,
      signerName: req.user.name,
      x,
      y,
      width: width || 20,
      height: height || 5,
      page: page || 1,
      type: type || 'text',
    });

    // Update document status to pending if it was draft
    if (document.status === 'draft') {
      document.status = 'pending';
      await document.save();
    }

    res.status(201).json({
      success: true,
      data: signature,
    });

    // Log activity
    logActivity({
      documentId: documentId,
      userId: req.user._id,
      action: 'signature_added',
      details: `Added ${type || 'text'} signature field on page ${page || 1}`,
      ipAddress: req.ip,
    });

    // If signerEmail differs from the owner, send an invite
    const { signerEmail: inviteEmail } = req.body;
    if (inviteEmail && inviteEmail !== req.user.email) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const signLink = `${frontendUrl}/document/${documentId}/edit`;
        await sendSignatureRequest({
          toEmail: inviteEmail,
          docTitle: document.title,
          signerName: inviteEmail,
          senderName: req.user.name,
          signLink,
        });
        signature.inviteSentAt = new Date();
        await signature.save();

        logActivity({
          documentId,
          userId: req.user._id,
          action: 'invite_sent',
          details: `Sent signature request to ${inviteEmail}`,
          ipAddress: req.ip,
        });
      } catch (emailErr) {
        console.error('Email invite error:', emailErr);
      }
    }
  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating signature',
    });
  }
};

// @desc    Get all signatures for a document
// @route   GET /api/signatures/:docId
// @access  Private
const getSignatures = async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view signatures for this document',
      });
    }

    const signatures = await Signature.find({
      document: req.params.docId,
    })
      .populate('signer', 'name email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: signatures.length,
      data: signatures,
    });
  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching signatures',
    });
  }
};

// @desc    Update signature (sign or reject)
// @route   PUT /api/signatures/:id
// @access  Private
const updateSignature = async (req, res) => {
  try {
    const { status, signatureData, rejectionReason, x, y, width, height, meta } =
      req.body;

    const signature = await Signature.findById(req.params.id);
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
      });
    }

    // Only the signer or document owner can update
    if (signature.signer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this signature',
      });
    }

    // Update position if provided
    if (x !== undefined) signature.x = x;
    if (y !== undefined) signature.y = y;
    if (width !== undefined) signature.width = width;
    if (height !== undefined) signature.height = height;

    // Update status
    if (status) {
      signature.status = status;
      if (status === 'signed') {
        signature.signedAt = new Date();
        if (signatureData) {
          signature.signatureData = signatureData;
        }
        if (meta !== undefined) {
          signature.meta = meta;
        }
      }
      if (status === 'rejected' && rejectionReason) {
        signature.rejectionReason = rejectionReason;
      }
    }

    await signature.save();

    // Check if all signatures for the document are signed
    if (status === 'signed') {
      const document = await Document.findById(signature.document);
      const allSignatures = await Signature.find({
        document: signature.document,
      });
      const allSigned = allSignatures.every((s) => s.status === 'signed');
      if (allSigned) {
        document.status = 'signed';
        await document.save();
      }
    }

    // If rejected, update document status
    if (status === 'rejected') {
      const document = await Document.findById(signature.document);
      document.status = 'rejected';
      await document.save();
    }

    res.json({
      success: true,
      data: signature,
    });

    // Log activity
    if (status === 'signed') {
      logActivity({
        documentId: signature.document,
        userId: req.user._id,
        action: 'signature_signed',
        details: `Signed by ${req.user.name} (${req.user.email})`,
        ipAddress: req.ip,
      });

      // Notify document owner
      try {
        const ownerDoc = await Document.findById(signature.document).populate('owner', 'name email');
        if (ownerDoc && ownerDoc.owner.email !== req.user.email) {
          await sendSignatureComplete({
            toEmail: ownerDoc.owner.email,
            docTitle: ownerDoc.title,
            signerName: req.user.name,
          });
        }
      } catch (emailErr) {
        console.error('Notification email error:', emailErr);
      }
    } else if (status === 'rejected') {
      logActivity({
        documentId: signature.document,
        userId: req.user._id,
        action: 'signature_rejected',
        details: `Rejected by ${req.user.name}${rejectionReason ? ': ' + rejectionReason : ''}`,
        ipAddress: req.ip,
      });
    }
  } catch (error) {
    console.error('Update signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating signature',
    });
  }
};

// @desc    Delete a signature field
// @route   DELETE /api/signatures/:id
// @access  Private
const deleteSignature = async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
      });
    }

    if (signature.signer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this signature',
      });
    }

    await Signature.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Signature deleted successfully',
    });

    logActivity({
      documentId: signature.document,
      userId: req.user._id,
      action: 'signature_deleted',
      details: 'Removed a signature field',
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting signature',
    });
  }
};

module.exports = {
  createSignature,
  getSignatures,
  updateSignature,
  deleteSignature,
};
