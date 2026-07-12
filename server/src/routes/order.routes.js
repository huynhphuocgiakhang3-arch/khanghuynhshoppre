const express = require('express');
const router = express.Router();

const { createOrder, getMyOrders, getOrderById } = require('../controllers/order.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createOrderValidator } = require('../utils/validators/common.validator');

router.use(protect);

router.post('/', createOrderValidator, validate, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
