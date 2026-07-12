const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 4, max: 32 })
    .withMessage('Ten dang nhap phai tu 4-32 ky tu')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Ten dang nhap chi gom chu, so va gach duoi'),
  body('email').trim().isEmail().withMessage('Email khong hop le').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mat khau toi thieu 8 ky tu')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('Mat khau phai co chu hoa, chu thuong va so'),
  body('fullName').optional().trim().isLength({ max: 64 }),
];

const loginValidator = [
  body('emailOrUsername').trim().notEmpty().withMessage('Vui long nhap email hoac ten dang nhap'),
  body('password').notEmpty().withMessage('Vui long nhap mat khau'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Email khong hop le').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Thieu token'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mat khau toi thieu 8 ky tu')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('Mat khau phai co chu hoa, chu thuong va so'),
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator };
