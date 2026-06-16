const express = require('express');
const router = express.Router();
const {
  uploadDoc,
  getDocs,
  getDocById,
  getDocFile,
  deleteDoc,
} = require('../controllers/docController');
const { downloadSignedPDF } = require('../controllers/downloadController');
const { toggleShare } = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.post('/upload', upload.single('document'), uploadDoc);
router.get('/', getDocs);
router.get('/:id', getDocById);
router.get('/:id/file', getDocFile);
router.get('/:id/download', downloadSignedPDF);
router.post('/:id/share', toggleShare);
router.delete('/:id', deleteDoc);

module.exports = router;
