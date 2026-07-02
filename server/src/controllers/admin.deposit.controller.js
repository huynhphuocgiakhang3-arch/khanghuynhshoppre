const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/admin/deposits
 * @desc Danh sach lenh nap tien QR dang cho duyet (co the loc theo status).
 *       Mac dinh chi lay nhung lenh da co anh xac nhan (proofImage) de Admin
 *       khong bi lam nhieu boi nhung lenh khach tao QR nhung chua chuyen tien.
 */
const getAllDeposits = catchAsync(async (req, res) => {
  const { status = 'pending', page = 1, limit = 20, onlyWithProof = 'true' } = req.query;
  const filter = { type: 'deposit', method: 'vietqr' };
  if (status) filter.status = status;
  if (onlyWithProof === 'true') filter.proofImage = { $ne: '' };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'username email'),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route PATCH /api/admin/deposits/:id/approve
 * @desc Duyet lenh nap QR: cong so du dung bang so tien khach da tao lenh.
 */
const approveDeposit = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, type: 'deposit' });
  if (!transaction) return next(new AppError('Khong tim thay giao dich.', 404));
  if (transaction.status !== 'pending') {
    return next(new AppError('Giao dich nay da duoc xu ly truoc do.', 400));
  }

  const user = await User.findById(transaction.user);
  if (!user) return next(new AppError('Khong tim thay user.', 404));

  const balanceBefore = user.balance;
  user.balance += transaction.amount;
  await user.save();

  transaction.status = 'success';
  transaction.balanceBefore = balanceBefore;
  transaction.balanceAfter = user.balance;
  await transaction.save();

  res.status(200).json({ success: true, data: transaction });
});

/**
 * @route PATCH /api/admin/deposits/:id/reject
 * @desc Tu choi lenh nap QR (anh khong hop le/khong khop so tien...), khong cong tien.
 */
const rejectDeposit = catchAsync(async (req, res, next) => {
  const { note } = req.body;
  const transaction = await Transaction.findOne({ _id: req.params.id, type: 'deposit' });
  if (!transaction) return next(new AppError('Khong tim thay giao dich.', 404));
  if (transaction.status !== 'pending') {
    return next(new AppError('Giao dich nay da duoc xu ly truoc do.', 400));
  }

  transaction.status = 'failed';
  transaction.note = note || 'Ảnh xác nhận không hợp lệ hoặc không khớp số tiền.';
  await transaction.save();

  res.status(200).json({ success: true, data: transaction });
});

module.exports = { getAllDeposits, approveDeposit, rejectDeposit };
