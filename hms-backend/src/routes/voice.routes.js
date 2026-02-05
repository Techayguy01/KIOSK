const express = require('express');
const router = express.Router();
const multer = require('multer');
const voiceController = require('../controllers/voice.controller');

// Configure Multer for temp storage
const upload = multer({ dest: 'uploads/' });

// POST /api/v1/voice
router.post('/', upload.single('audio_blob'), voiceController.processVoice);

module.exports = router;