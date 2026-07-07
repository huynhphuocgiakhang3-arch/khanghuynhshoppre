/**
 * Boc cac async controller de tu dong bat loi va chuyen cho next(error),
 * tranh phai lap lai try/catch trong tung controller.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
