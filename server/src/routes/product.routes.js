const express = require('express');
const router = express.Router();

const { getProducts, getProductBySlug } = require('../controllers/product.controller');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

router.get('/', optionalAuth, getProducts);
router.get('/:slug', optionalAuth, getProductBySlug);

module.exports = router;
