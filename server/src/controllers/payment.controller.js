const SystemConfig = require('../models/SystemConfig');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  verifyWebhookAuth,
  processIncomingBankTransaction,
} = require('../services/paymentGateway.service');

/**
 * @route POST /api/payment/webhook
 * @desc Endpoint nhan du lieu bien dong so du tu cong trung gian
 *       (SePay/Casso/PayOS...). URL nay can duoc khai bao trong trang
 *       quan tri cua nha cung cap da chon.
 *
 * Vi du payload cua SePay (rut gon):
 * {
 *   "gateway": "MBBank",
 *   "transactionDate": "2026-06-26 10:00:00",
 *   "accountNumber": "0123456789",
 *   "transferAmount": 50000,
 *   "content": "KH7F3A9B2C tra tien...",
 *   "referenceCode": "FT123456"
 * }
 */
const handlePaymentWebhook = catchAsync(async (req, res, next) => {
  const config = await SystemConfig.findOne().select('+paymentGateway.apiKey +paymentGateway.webhookSecret');

  if (!config || !verifyWebhookAuth(req, config)) {
    return next(new AppError('Webhook khong hop le hoac chua duoc cau hinh.', 401));
  }

  const body = req.body;

  // Chuan hoa du lieu tu cac nha cung cap khac nhau ve cung 1 format
  const normalized = {
    amount: body.transferAmount ?? body.amount ?? 0,
    content: body.content ?? body.description ?? '',
    gatewayRef: body.referenceCode ?? body.id ?? body.transactionId ?? null,
  };

  const result = await processIncomingBankTransaction(normalized);

  // Luon tra ve 200 de cong trung gian khong gui lai webhook nhieu lan,
  // ket qua khop lenh hay khong duoc the hien qua truong "matched"
  res.status(200).json({ success: true, ...result });
});

module.exports = { handlePaymentWebhook };
