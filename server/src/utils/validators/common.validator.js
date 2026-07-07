const { body } = require('express-validator');

const createDepositValidator = [
  body('amount').isFloat({ min: 1000 }).withMessage('So tien nap toi thieu 1.000 VND'),
];

const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('Don hang phai co it nhat 1 san pham'),
  body('items.*.productId').notEmpty().withMessage('Thieu productId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('So luong toi thieu la 1'),
];

const adjustBalanceValidator = [
  body('amount').isFloat().withMessage('So tien dieu chinh phai la so').not().equals('0').withMessage('So tien khong duoc bang 0'),
];

const contactValidator = [
  body('name').trim().notEmpty().withMessage('Vui long nhap ho ten'),
  body('email').trim().isEmail().withMessage('Email khong hop le'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Noi dung tin nhan tu 5-2000 ky tu'),
];

module.exports = { createDepositValidator, createOrderValidator, adjustBalanceValidator, contactValidator };
