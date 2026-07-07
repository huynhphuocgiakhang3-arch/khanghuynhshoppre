const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  verifyAdminPin,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../utils/validators/auth.validator');

// Gioi han rieng, RAT CHAT cho buoc nhap PIN admin - PIN la mot day so dai
// nen khong gioi han thi ve ly thuyet van co the bi do (brute-force) neu
// khong co rate limit; 5 lan/15 phut la du dung ma van chan duoc do tu dong.
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút.' },
});

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/verify-admin-pin', pinLimiter, verifyAdminPin);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

module.exports = router;
