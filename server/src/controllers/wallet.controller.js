const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateVietQR, generateVietQRWithToken, checkTransactionByContent } = require('../services/vietqr.service');
const { generateSimpleTransferCode } = require('../utils/generateCode');
const { notifyNewDepositProof } = require('../services/telegram.service');
const { checkBalanceAnomaly } = require('../services/antiCrack.service');
const { creditAdvisorsOnDeposit } = require('../services/advisorCommission.service');

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

  // Sinh ma "KHANGHUYNH" + 6 so ngau nhien, kiem tra khong trung voi 1 lenh
  // "pending" khac dang cho xu ly (toi da thu lai 5 lan - xac suat trung
  // gan nhu bang 0 nhung van kiem tra cho chac chan tuyet doi khong bi tinh
  // nham tien cua 2 nguoi vao chung 1 ma).
  let transferContent = generateSimpleTransferCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await Transaction.exists({ transferContent, status: 'pending' });
    if (!exists) break;
    transferContent = generateSimpleTransferCode();
  }

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

  // Su dung VietQR token API neu da cau hinh, neu khong thi dung API cong khai
  let qrResult;
  if (process.env.VIETQR_TOKEN) {
    qrResult = await generateVietQRWithToken(numericAmount, transferContent);
  } else {
    qrResult = await generateVietQR(numericAmount, transferContent);
  }

  const { qrImageUrl, bankInfo } = qrResult;

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
 *       Neu co VIETQR_TOKEN, se tu dong kiem tra giao dich ngan hang va cong tien.
 */
const checkDepositStatus = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findOne({
    _id: req.params.transactionId,
    user: req.user._id,
    type: 'deposit',
  });

  if (!transaction) return next(new AppError('Khong tim thay giao dich.', 404));

  // Neu giao dich da success hoac failed, tra ve trang thai hien tai
  if (transaction.status !== 'pending') {
    return res.status(200).json({
      success: true,
      data: {
        status: transaction.status,
        amount: transaction.amount,
        balanceAfter: transaction.status === 'success' ? transaction.balanceAfter : null,
      },
    });
  }

  // Neu giao dich dang pending va co VIETQR_TOKEN, kiem tra giao dich ngan hang
  if (process.env.VIETQR_TOKEN) {
    try {
      const checkResult = await checkTransactionByContent(transaction.transferContent);

      if (checkResult.found) {
        // Tim thay giao dich, kiem tra so tien
        if (Number(checkResult.amount) >= transaction.amount) {
          // Cong tien cho user
          const User = require('../models/User');
          const user = await User.findById(req.user._id);
          
          if (user) {
            const balanceBefore = user.balance;
            const creditAmount = Number(checkResult.amount);
            user.balance += creditAmount;
            await user.save();

            // Cap nhat transaction
            transaction.status = 'success';
            transaction.amount = creditAmount;
            transaction.balanceBefore = balanceBefore;
            transaction.balanceAfter = user.balance;
            transaction.note = `Tự động cộng tiền qua VietQR Token API`;
            await transaction.save();

            // Gui thong bao
            const { notifyDepositApproved } = require('../services/telegram.service');
            notifyDepositApproved('vietqr_auto', {
              username: user.username,
              amount: creditAmount,
              balanceAfter: user.balance,
              adminUsername: 'Hệ thống (tự động qua VietQR Token)',
              method: 'vietqr_auto',
              refNote: `Mã GD: ${transaction.transferContent}`,
            }).catch(() => {});
            
            checkBalanceAnomaly(user, balanceBefore, user.balance, 'VietQR Token tự động').catch(() => {});
            creditAdvisorsOnDeposit(creditAmount, 'VietQR Token tự động').catch(() => {});

            return res.status(200).json({
              success: true,
              data: {
                status: 'success',
                amount: creditAmount,
                balanceAfter: user.balance,
              },
            });
          }
        }
      }
    } catch (error) {
      // Neu kiem tra that bai, van tra ve pending de frontend tiep tuc poll
      console.error('Error checking transaction:', error.message);
    }
  }

  // Neu khong tim thay giao dich hoac khong co token, tra ve pending
  res.status(200).json({
    success: true,
    data: {
      status: 'pending',
      amount: transaction.amount,
      balanceAfter: null,
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
