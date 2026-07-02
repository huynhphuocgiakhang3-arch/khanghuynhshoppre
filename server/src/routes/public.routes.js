const express = require('express');
const router = express.Router();

const { submitContactForm, getPublicConfig } = require('../controllers/contact.controller');
const { getActiveCategories } = require('../controllers/category.controller');
const validate = require('../middlewares/validate.middleware');
const { contactValidator } = require('../utils/validators/common.validator');

router.post('/contact', contactValidator, validate, submitContactForm);
router.get('/config/public', getPublicConfig);
router.get('/categories', getActiveCategories);

module.exports = router;
