const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Signature = require('../models/Signature');
const { logActivity } = require('./auditController');

// @desc    Generate or toggle share link for a document
// @route   POST /api/docs/:id/share
// @access  Private
const toggleShare = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this document',
      });
    }

    // Toggle sharing
    if (document.isPublic) {
      // Disable sharing
      document.isPublic = false;
      document.shareToken = undefined;
      await document.save();

      return res.json({
        success: true,
        data: { isPublic: false, shareToken: null },
        message: 'Sharing disabled',
      });
    }

    // Enable sharing — generate token if not present
    if (!document.shareToken) {
      document.shareToken = uuidv4();
    }
    document.isPublic = true;
    await document.save();

    // Log activity
    await logActivity({
      documentId: document._id,
      userId: req.user._id,
      action: 'document_shared',
      details: 'Generated public share link',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        isPublic: true,
        shareToken: document.shareToken,
      },
      message: 'Sharing enabled',
    });
  } catch (error) {
    console.error('Toggle share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling share',
    });
  }
};

// @desc    Get document details via public share token
// @route   GET /api/public/:token
// @access  Public (no auth)
const getSharedDoc = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareToken: req.params.token,
      isPublic: true,
    }).populate('owner', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Shared document not found or link has expired',
      });
    }

    const signatures = await Signature.find({ document: document._id })
      .populate('signer', 'name email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        document: {
          _id: document._id,
          title: document.title,
          fileName: document.fileName,
          fileSize: document.fileSize,
          status: document.status,
          totalPages: document.totalPages,
          owner: document.owner,
          createdAt: document.createdAt,
        },
        signatures,
      },
    });
  } catch (error) {
    console.error('Get shared doc error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shared document',
    });
  }
};

// @desc    Serve PDF file via public share token
// @route   GET /api/public/:token/file
// @access  Public (no auth)
const getSharedDocFile = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareToken: req.params.token,
      isPublic: true,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Shared document not found',
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`
    );
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get shared doc file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving shared document file',
    });
  }
};

// @desc    Sign a document via public share link (no auth required)
// @route   PUT /api/public/:token/sign/:sigId
// @access  Public (no auth)
const signViaPublicLink = async (req, res) => {
  try {
    const { signerName, signerEmail, signatureData, type } = req.body;

    if (!signerName || !signerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name and email',
      });
    }

    const document = await Document.findOne({
      shareToken: req.params.token,
      isPublic: true,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Shared document not found or link expired',
      });
    }

    const signature = await Signature.findById(req.params.sigId);
    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature field not found',
      });
    }

    if (signature.document.toString() !== document._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Signature does not belong to this document',
      });
    }

    if (signature.status === 'signed') {
      return res.status(400).json({
        success: false,
        message: 'This field has already been signed',
      });
    }

    // Apply signature
    signature.status = 'signed';
    signature.signatureData = signatureData;
    signature.type = type || 'text';
    signature.signerName = signerName;
    signature.signerEmail = signerEmail;
    signature.signedAt = new Date();
    await signature.save();

    // Check if all signatures are now signed
    const allSignatures = await Signature.find({ document: document._id });
    const allSigned = allSignatures.every((s) => s.status === 'signed');
    if (allSigned) {
      document.status = 'signed';
      await document.save();
    }

    // Log activity
    await logActivity({
      documentId: document._id,
      action: 'signature_signed',
      details: `Signed via public link by ${signerName} (${signerEmail})`,
      actorName: signerName,
      actorEmail: signerEmail,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: signature,
    });
  } catch (error) {
    console.error('Public sign error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying signature',
    });
  }
};

module.exports = { toggleShare, getSharedDoc, getSharedDocFile, signViaPublicLink };
