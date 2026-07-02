const express = require('express');
const router = express.Router();

const {
  createDepositQR,
  checkDepositStatus,
  getMyTransactions,
  getBalance,
  uploadDepositProof,
} = require('../controllers/wallet.controller');
const { submitCardTopup, getMyCardTopups } = require('../controllers/cardTopup.controller');
const { uploadImage } = require('../config/cloudinary');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createDepositValidator } = require('../utils/validators/common.validator');

router.use(protect); // Tat ca route vi deu yeu cau dang nhap

router.get('/balance', getBalance);
router.get('/transactions', getMyTransactions);
router.post('/deposit/create-qr', createDepositValidator, validate, createDepositQR);
router.get('/deposit/:transactionId/status', checkDepositStatus);
router.post('/deposit/:transactionId/proof', uploadImage.single('file'), uploadDepositProof);

// ----- Nap tien bang the cao (duyet thu cong boi Admin) -----
router.post('/card-topup', submitCardTopup);
router.get('/card-topup/mine', getMyCardTopups);

module.exports = router;
