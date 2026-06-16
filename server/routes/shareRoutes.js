const express = require('express');
const router = express.Router();
const {
  getSharedDoc,
  getSharedDocFile,
  signViaPublicLink,
} = require('../controllers/shareController');

// These routes are PUBLIC — no auth middleware
router.get('/:token', getSharedDoc);
router.get('/:token/file', getSharedDocFile);
router.put('/:token/sign/:sigId', signViaPublicLink);

module.exports = router;
