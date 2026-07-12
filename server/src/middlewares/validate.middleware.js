const { validationResult } = require('express-validator');

/**
 * Chay sau cac rule cua express-validator. Neu co loi, tra ve 400
 * voi danh sach loi ro rang, neu khong thi cho di tiep.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Du lieu khong hop le.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
