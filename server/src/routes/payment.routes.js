const express = require('express');
const router = express.Router();

const { handlePaymentWebhook } = require('../controllers/payment.controller');

// Khong dung middleware `protect` vi day la webhook tu he thong ben thu 3 goi vao,
// xac thuc duoc thuc hien rieng bang apiKey/webhookSecret trong controller.
router.post('/webhook', handlePaymentWebhook);

module.exports = router;
