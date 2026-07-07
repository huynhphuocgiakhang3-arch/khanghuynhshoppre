const express = require('express');
const router = express.Router();

const { submitContactForm, getPublicConfig } = require('../controllers/contact.controller');
const { getActiveCategories } = require('../controllers/category.controller');
const { getActiveFeatures } = require('../controllers/serviceOrder.controller');
const validate = require('../middlewares/validate.middleware');
const { contactValidator } = require('../utils/validators/common.validator');

router.post('/contact', contactValidator, validate, submitContactForm);
router.get('/config/public', getPublicConfig);
router.get('/categories', getActiveCategories);
router.get('/service-features', getActiveFeatures);

/**
 * @route GET /api/my-ip
 * @desc Cong cu CHAN DOAN: tra ve CHINH XAC IP ma server dang nhan dien cho
 *       chinh request nay - dung de dien vao ADMIN_ALLOWED_IPS (.env) cho
 *       chuan, thay vi doan mo qua cac trang xem IP ben ngoai (nhung trang
 *       do cho ban IP that, nhung KHONG chac chan trung voi gia tri
 *       Express thuc su doc duoc qua header X-Forwarded-For neu cau hinh
 *       proxy sai). Mo link nay tren dung thiet bi/mang ban muon whitelist,
 *       copy dung gia tri o truong "detectedIp" la chinh xac tuyet doi.
 */
router.get('/my-ip', (req, res) => {
  res.status(200).json({
    success: true,
    detectedIp: req.ip,
    rawForwardedForHeader: req.headers['x-forwarded-for'] || null,
    note: 'Dien dung gia tri "detectedIp" vao ADMIN_ALLOWED_IPS trong .env cua server (cach nhau boi dau phay neu nhieu IP).',
  });
});

module.exports = router;
