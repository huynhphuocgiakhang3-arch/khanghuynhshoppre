const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware kiem tra JWT trong header Authorization: Bearer <token>.
 * Neu hop le, gan req.user = user tu DB (khong gom password).
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Ban chua dang nhap. Vui long dang nhap de tiep tuc.', 401));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return next(new AppError('Token khong hop le hoac da het han.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('Tai khoan khong ton tai.', 401));
  }

  if (user.status === 'banned') {
    return next(new AppError('Tai khoan cua ban da bi khoa.', 403));
  }

  req.user = user;
  next();
});

module.exports = protect;
