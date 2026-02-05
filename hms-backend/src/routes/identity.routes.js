const express = require('express');
const router = express.Router();
const multer = require('multer');
const identityController = require('../controllers/identity.controller');

// Use MemoryStorage so we don't save sensitive ID images to disk
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/identity/scan
router.post('/scan', upload.single('id_card_image'), identityController.scanIdentity);

module.exports = router;