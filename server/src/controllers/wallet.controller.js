const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateVietQR } = require('../services/vietqr.service');
const { generateTransferContent } = require('../utils/generateCode');
const { notifyNewDepositProof } = require('../services/telegram.service');

/**
 * @route POST /api/wallet/deposit/create-qr
 * @desc Tao mot lenh nap tien moi: sinh transferContent + QR code,
 *       luu Transaction voi status = 'pending' cho den khi webhook khop lenh.
 */
const createDepositQR = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  const numericAmount = Number(amount);

  const config = await SystemConfig.getSingleton();
  const { minAmount, maxAmount } = config.depositLimits;

  if (!numericAmount || numericAmount < minAmount || numericAmount > maxAmount) {
    return next(
      new AppError(
        `So tien nap phai trong khoang ${minAmount.toLocaleString('vi-VN')} - ${maxAmount.toLocaleString('vi-VN')} VND.`,
        400
      )
    );
  }

  const transferContent = generateTransferContent(req.user._id);

  const transaction = await Transaction.create({
    user: req.user._id,
    type: 'deposit',
    amount: numericAmount,
    balanceBefore: req.user.balance,
    balanceAfter: req.user.balance, // se duoc cap nhat khi webhook khop lenh
    status: 'pending',
    method: 'vietqr',
    transferContent,
  });

  const { qrImageUrl, bankInfo } = await generateVietQR(numericAmount, transferContent);

  res.status(201).json({
    success: true,
    data: {
      transactionId: transaction._id,
      transactionCode: transaction.transactionCode,
      transferContent,
      qrImageUrl,
      bankInfo,
      expiresInMinutes: 15,
    },
  });
});

/**
 * @route GET /api/wallet/deposit/:transactionId/status
 * @desc Frontend poll API nay de kiem tra lenh nap tien da duoc khop hay chua.
 */
const checkDepositStatus = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findOne({
    _id: req.params.transactionId,
    user: req.user._id,
    type: 'deposit',
  });

  if (!transaction) return next(new AppError('Khong tim thay giao dich.', 404));

  res.status(200).json({
    success: true,
    data: {
      status: transaction.status,
      amount: transaction.amount,
      balanceAfter: transaction.status === 'success' ? transaction.balanceAfter : null,
    },
  });
});

/**
 * @route GET /api/wallet/transactions
 * @desc Lich su giao dich cua user dang dang nhap, co pagination.
 */
const getMyTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const filter = { user: req.user._id };
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: transactions,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route GET /api/wallet/balance
 */
const getBalance = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { balance: req.user.balance } });
});

/**
 * @route POST /api/wallet/deposit/:transactionId/proof
 * @desc Khach upload anh chup man hinh xac nhan da chuyen khoan, dinh kem
 *       vao Transaction dang pending de Admin doi soat thu cong (dung cho
 *       truong hop chua co webhook tu dong tu cong thanh toan).
 *       Middleware uploadImage.single('file') da xu ly upload len Cloudinary truoc do.
 */
const uploadDepositProof = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Vui long chon anh xac nhan chuyen khoan.', 400));
  }

  const transaction = await Transaction.findOne({
    _id: req.params.transactionId,
    user: req.user._id,
    type: 'deposit',
  });

  if (!transaction) return next(new AppError('Khong tim thay giao dich.', 404));
  if (transaction.status !== 'pending') {
    return next(new AppError('Giao dich nay da duoc xu ly, khong the gui anh xac nhan them.', 400));
  }

  transaction.proofImage = req.file.path;
  await transaction.save();

  notifyNewDepositProof(transaction, req.user.username).catch(() => {});

  res.status(200).json({ success: true, message: 'Đã gửi ảnh xác nhận, vui lòng chờ Admin duyệt.' });
});

module.exports = {
  createDepositQR,
  checkDepositStatus,
  getMyTransactions,
  getBalance,
  uploadDepositProof,
};
