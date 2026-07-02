const AppError = require('../utils/AppError');

/**
 * Middleware nghiem ngat chi cho phep role === 'admin' truy cap.
 * PHAI dat sau middleware `protect` (can req.user da duoc gan).
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Ban chua dang nhap.', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Ban khong co quyen truy cap chuc nang nay.', 403));
  }

  next();
};

module.exports = adminOnly;
