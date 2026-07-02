const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../services/mail.service');

/** Tao response chuan chua user + token, dung lai cho register/login */
const sendAuthResponse = (res, statusCode, user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.status(statusCode).json({
    success: true,
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
};

/**
 * @route POST /api/auth/register
 */
const register = catchAsync(async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return next(new AppError('Email hoac ten dang nhap da duoc su dung.', 409));
  }

  const user = await User.create({ username, email, password, fullName });

  sendWelcomeEmail(user).catch((err) => console.error('[Mail] Loi gui welcome email:', err.message));

  sendAuthResponse(res, 201, user);
});

/**
 * @route POST /api/auth/login
 */
const login = catchAsync(async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Email/ten dang nhap hoac mat khau khong dung.', 401));
  }

  if (user.status === 'banned') {
    return next(new AppError('Tai khoan cua ban da bi khoa. Vui long lien he ho tro.', 403));
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, 200, user);
});

/**
 * @route POST /api/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) return next(new AppError('Thieu refresh token.', 400));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    return next(new AppError('Refresh token khong hop le hoac da het han.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('Tai khoan khong ton tai.', 401));

  const accessToken = generateAccessToken(user._id, user.role);
  res.status(200).json({ success: true, data: { accessToken } });
});

/**
 * @route GET /api/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

/**
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Khong tiet lo email co ton tai hay khong, tranh do quet tai khoan
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'Neu email ton tai trong he thong, ban se nhan duoc huong dan dat lai mat khau.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phut
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendResetPasswordEmail(user, resetUrl);

  res.status(200).json({
    success: true,
    message: 'Neu email ton tai trong he thong, ban se nhan duoc huong dan dat lai mat khau.',
  });
});

/**
 * @route POST /api/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return next(new AppError('Token khong hop le hoac da het han.', 400));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Dat lai mat khau thanh cong. Vui long dang nhap lai.' });
});

module.exports = { register, login, refreshToken, getMe, forgotPassword, resetPassword };
