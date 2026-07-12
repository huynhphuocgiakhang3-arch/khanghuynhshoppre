const express = require('express');
const router = express.Router();

const optionalAuth = require('../middlewares/optionalAuth.middleware');
const { validateCoupon } = require('../controllers/coupon.controller');

// optionalAuth: gan req.user NEU khach da dang nhap (de tinh dung gia VIP
// khi preview muc giam), nhung KHONG bat buoc phai dang nhap moi xem duoc.
router.post('/validate', optionalAuth, validateCoupon);

module.exports = router;
