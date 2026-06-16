const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');

/**
 * Reusable helper: Log an activity event for a document
 * Can be called from any controller without requiring req/res
 */
const logActivity = async ({
  documentId,
  userId = null,
  action,
  details = '',
  actorName = '',
  actorEmail = '',
  ipAddress = '',
}) => {
  try {
    await AuditLog.create({
      document: documentId,
      user: userId,
      action,
      details,
      actorName,
      actorEmail,
      ipAddress,
    });
  } catch (error) {
    // Log but don't throw — audit logging should never break main flows
    console.error('Audit log error:', error);
  }
};

// @desc    Get audit logs for a document
// @route   GET /api/audit/:docId
// @access  Private
const getAuditLogs = async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Only the document owner can view audit logs
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view audit logs for this document',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ document: req.params.docId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments({
      document: req.params.docId,
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
    });
  }
};

module.exports = { logActivity, getAuditLogs };
