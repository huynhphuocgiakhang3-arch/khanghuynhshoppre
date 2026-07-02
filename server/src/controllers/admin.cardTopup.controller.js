const CardTopup = require('../models/CardTopup');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/admin/card-topups
 * @desc Danh sach the cao khach gui, loc theo trang thai (mac dinh: pending truoc)
 */
const getAllCardTopups = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    CardTopup.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'username email')
      .populate('processedBy', 'username'),
    CardTopup.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route PATCH /api/admin/card-topups/:id/approve
 * @desc Duyet the hop le: cong so du user dung bang menh gia the, tao
 *       Transaction (method='card') de doi soat, danh dau da xu ly.
 */
const approveCardTopup = catchAsync(async (req, res, next) => {
  const cardTopup = await CardTopup.findById(req.params.id);
  if (!cardTopup) return next(new AppError('Khong tim thay the nay.', 404));
  if (cardTopup.status !== 'pending') {
    return next(new AppError('The nay da duoc xu ly truoc do.', 400));
  }

  const user = await User.findById(cardTopup.user);
  if (!user) return next(new AppError('Khong tim thay user.', 404));

  const balanceBefore = user.balance;
  user.balance += cardTopup.amount;
  await user.save();

  const transaction = await Transaction.create({
    user: user._id,
    type: 'deposit',
    amount: cardTopup.amount,
    balanceBefore,
    balanceAfter: user.balance,
    status: 'success',
    method: 'card',
    note: `Nạp thẻ cào ${cardTopup.cardType} - mệnh giá ${cardTopup.amount.toLocaleString('vi-VN')}đ`,
  });

  cardTopup.status = 'success';
  cardTopup.relatedTransaction = transaction._id;
  cardTopup.processedBy = req.user._id;
  cardTopup.processedAt = new Date();
  await cardTopup.save();

  res.status(200).json({ success: true, data: cardTopup });
});

/**
 * @route PATCH /api/admin/card-topups/:id/reject
 * @desc Tu choi the sai/da su dung: khong cong tien, ghi ly do neu co.
 */
const rejectCardTopup = catchAsync(async (req, res, next) => {
  const { note } = req.body;
  const cardTopup = await CardTopup.findById(req.params.id);
  if (!cardTopup) return next(new AppError('Khong tim thay the nay.', 404));
  if (cardTopup.status !== 'pending') {
    return next(new AppError('The nay da duoc xu ly truoc do.', 400));
  }

  cardTopup.status = 'failed';
  cardTopup.adminNote = note || 'Thẻ không hợp lệ hoặc đã qua sử dụng.';
  cardTopup.processedBy = req.user._id;
  cardTopup.processedAt = new Date();
  await cardTopup.save();

  res.status(200).json({ success: true, data: cardTopup });
});

module.exports = { getAllCardTopups, approveCardTopup, rejectCardTopup };
