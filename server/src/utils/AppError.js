/**
 * Loi nghiep vu tuy chinh, dung de phan biet voi loi he thong khong mong muon.
 * Controller chi can throw new AppError('...', 400) la middleware loi se xu ly dung.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
