const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const { checkPayment } = require('../controllers/checkPayment.controller');

router.get('/check-payment', protect, checkPayment);

module.exports = router;
