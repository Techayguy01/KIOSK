const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// GET /api/v1/rooms/available
router.get('/available', roomController.getAvailableRooms);

module.exports = router;