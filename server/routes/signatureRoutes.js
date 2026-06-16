const express = require('express');
const router = express.Router();
const {
  createSignature,
  getSignatures,
  updateSignature,
  deleteSignature,
} = require('../controllers/signatureController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/', createSignature);
router.get('/:docId', getSignatures);
router.put('/:id', updateSignature);
router.delete('/:id', deleteSignature);

module.exports = router;
