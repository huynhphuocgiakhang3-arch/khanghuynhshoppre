const { body } = require('express-validator');

const productValidator = [
  body('name').trim().notEmpty().withMessage('Vui long nhap ten san pham').isLength({ max: 150 }),
  body('price').isFloat({ min: 0 }).withMessage('Gia phai la so khong am'),
  body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Gia sale phai la so khong am'),
  body('category').trim().notEmpty().withMessage('Vui long chon danh muc san pham'),
  body('stock').optional().isInt({ min: 0 }).withMessage('So luong khong hop le'),
  body('soldCount').optional().isInt({ min: 0 }).withMessage('So luong da ban khong hop le'),
  body('features').optional().isArray().withMessage('Danh sach tinh nang khong hop le'),
  body('variants').optional().isArray().withMessage('Danh sach goi khong hop le'),
  body('variants.*.name').optional().trim().notEmpty().withMessage('Ten goi khong duoc de trong'),
  body('variants.*.price').optional().isFloat({ min: 0 }).withMessage('Gia goi khong hop le'),
  body('testVideoUrl').optional({ nullable: true }).isString().withMessage('Video test khong hop le'),
];

module.exports = { productValidator };
