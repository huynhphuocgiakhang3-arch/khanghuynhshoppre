const express = require('express');
const router = express.Router();

const { createServiceOrder, getMyServiceOrders } = require('../controllers/serviceOrder.controller');
const protect = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/', createServiceOrder);
router.get('/mine', getMyServiceOrders);

module.exports = router;
