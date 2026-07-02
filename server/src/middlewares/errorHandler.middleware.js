/**
 * Middleware xu ly loi tap trung. Dat o cuoi cung trong server.js.
 * Phan biet loi nghiep vu (AppError, isOperational=true) voi loi he thong
 * de tranh lo thong tin nhay cam ra ngoai khi co bug.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Da co loi xay ra tu phia server.';

  // Loi trung key (unique) cua Mongo, vi du trung email/username
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Gia tri "${err.keyValue?.[field]}" cua truong "${field}" da ton tai.`;
  }

  // Loi validate cua Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Loi sai kieu du lieu ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Gia tri "${err.value}" khong hop le cho truong "${err.path}".`;
  }

  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
