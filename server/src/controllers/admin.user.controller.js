const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/admin/users
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: users,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route GET /api/admin/users/:id
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  res.status(200).json({ success: true, data: user });
});

/**
 * @route PATCH /api/admin/users/:id/balance
 * @desc Admin dieu chinh thu cong so du cua user (cong hoac tru),
 *       luon ghi lai log vao Transaction de minh bach, khong duoc xoa.
 */
const adjustUserBalance = catchAsync(async (req, res, next) => {
  const { amount, note } = req.body; // amount co the duong (cong) hoac am (tru)
  const numericAmount = Number(amount);

  if (!numericAmount || Number.isNaN(numericAmount)) {
    return next(new AppError('So tien dieu chinh khong hop le.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));

  const balanceBefore = user.balance;
  const balanceAfter = balanceBefore + numericAmount;

  if (balanceAfter < 0) {
    return next(new AppError('So du sau dieu chinh khong the am.', 400));
  }

  user.balance = balanceAfter;
  await user.save();

  await Transaction.create({
    user: user._id,
    type: 'admin_adjust',
    amount: numericAmount,
    balanceBefore,
    balanceAfter,
    status: 'success',
    method: 'manual',
    note: note || `Admin ${req.user.username} dieu chinh so du.`,
  });

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

/**
 * @route PATCH /api/admin/users/:id/reset-password
 * @desc Admin reset mat khau cho user, tra ve mat khau moi tam thoi.
 */
const resetUserPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));

  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
  user.password = tempPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Da reset mat khau. Vui long gui mat khau nay cho user qua kenh an toan.',
    data: { tempPassword },
  });
});

/**
 * @route PATCH /api/admin/users/:id/status
 * @desc Khoa (ban) hoac mo khoa (unban) tai khoan.
 */
const toggleUserStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body; // 'active' | 'banned'
  if (!['active', 'banned'].includes(status)) {
    return next(new AppError('Trang thai khong hop le.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  if (user.role === 'admin') {
    return next(new AppError('Khong the khoa tai khoan admin.', 403));
  }

  user.status = status;
  await user.save();

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

/**
 * @route DELETE /api/admin/users/:id
 */
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  if (user.role === 'admin') {
    return next(new AppError('Khong the xoa tai khoan admin.', 403));
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: 'Da xoa tai khoan.' });
});

module.exports = {
  getAllUsers,
  getUserById,
  adjustUserBalance,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
};
