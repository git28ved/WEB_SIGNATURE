const Document = require('../models/Document');
const Signature = require('../models/Signature');

// @desc    Get dashboard stats for current user
// @route   GET /api/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate document counts by status
    const statusCounts = await Document.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total documents
    const totalDocs = await Document.countDocuments({ owner: userId });

    // Total signatures placed by user
    const totalSignatures = await Signature.countDocuments({ signer: userId });

    // Build stats object
    const stats = {
      total: totalDocs,
      draft: 0,
      pending: 0,
      signed: 0,
      rejected: 0,
      totalSignatures,
    };

    statusCounts.forEach(({ _id, count }) => {
      if (stats.hasOwnProperty(_id)) {
        stats[_id] = count;
      }
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
    });
  }
};

module.exports = { getStats };
