const AppError = require('../utils/AppError');

/** Chi cho phep role === 'advisor' (Co van) truy cap - PHAI dat sau `protect` */
const advisorOnly = (req, res, next) => {
  if (!req.user) return next(new AppError('Bạn chưa đăng nhập.', 401));
  if (req.user.role !== 'advisor') {
    return next(new AppError('Bạn không có quyền truy cập chức năng này.', 403));
  }
  next();
};

module.exports = advisorOnly;
