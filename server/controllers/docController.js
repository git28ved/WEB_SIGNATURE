const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { logActivity } = require('./auditController');

// @desc    Upload a PDF document
// @route   POST /api/docs/upload
// @access  Private
const uploadDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF.',
      });
    }

    const title = req.body.title || req.file.originalname.replace('.pdf', '');

    const document = await Document.create({
      title,
      fileName: req.file.originalname,
      filePath: req.file.filename, // stored filename (not full path for security)
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: document,
    });

    // Log activity (fire-and-forget)
    logActivity({
      documentId: document._id,
      userId: req.user._id,
      action: 'document_created',
      details: `Uploaded "${document.title}" (${(document.fileSize / 1024).toFixed(1)} KB)`,
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
    });
  }
};

// @desc    Get all documents for current user
// @route   GET /api/docs
// @access  Private
const getDocs = async (req, res) => {
  try {
    const { status, search, sort } = req.query;

    // Build query
    const query = { owner: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Sort
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name') sortOption = { title: 1 };

    const documents = await Document.find(query)
      .sort(sortOption)
      .select('-__v');

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error('Get docs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
    });
  }
};

// @desc    Get single document by ID
// @route   GET /api/docs/:id
// @access  Private
const getDocById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      'owner',
      'name email'
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check ownership
    if (document.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Get doc by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
    });
  }
};

// @desc    Serve the actual PDF file
// @route   GET /api/docs/:id/file
// @access  Private
const getDocFile = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check ownership
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document',
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
    console.error('Get doc file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving document file',
    });
  }
};

// @desc    Delete a document
// @route   DELETE /api/docs/:id
// @access  Private
const deleteDoc = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check ownership
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document',
      });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });

    // Log activity (fire-and-forget)
    logActivity({
      documentId: req.params.id,
      userId: req.user._id,
      action: 'document_deleted',
      details: `Deleted "${document.title}"`,
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error('Delete doc error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
    });
  }
};

module.exports = { uploadDoc, getDocs, getDocById, getDocFile, deleteDoc };
