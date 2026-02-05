const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// POST /api/v1/payments/process
router.post('/process', paymentController.processPayment);

module.exports = router;