const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const advisorOnly = require('../middlewares/advisor.middleware');
const { getAdvisorBalance, requestWithdraw } = require('../controllers/advisor.controller');

router.use(protect, advisorOnly);
router.get('/me', getAdvisorBalance);
router.post('/withdraw', requestWithdraw);

module.exports = router;
