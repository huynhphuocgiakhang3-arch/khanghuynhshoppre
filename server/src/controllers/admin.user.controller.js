const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { notifyBalanceAdjusted, notifyUserDeleted, notifyRoleChanged, notifySecurityAlert } = require('../services/telegram.service');
const { checkBalanceAnomaly } = require('../services/antiCrack.service');
const { verifyTotpCode } = require('../utils/totp');

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

  // Anti-crack: moi lan admin cong/tru so du deu phai co thong bao Telegram,
  // khong ngoai le - dam bao minh bach & de doi soat neu co tranh chap sau nay.
  notifyBalanceAdjusted({
    username: user.username,
    adminUsername: req.user.username,
    amount: numericAmount,
    balanceBefore,
    balanceAfter,
    note,
  }).catch(() => {});
  checkBalanceAnomaly(user, balanceBefore, balanceAfter, `admin_adjust bởi ${req.user.username}`).catch(() => {});

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

/**
 * @route PATCH /api/admin/users/:id/reset-password
 * @desc Admin reset mat khau cho user, tra ve mat khau moi tam thoi. BAT
 *       BUOC nhap dung ma TOTP (6 so, doi moi 30s, lay tu app authenticator
 *       tren dien thoai Admin - xem utils/totp.js) truoc khi thuc hien -
 *       chan ke tan cong du co duoc access token admin (bi lo/danh cap) van
 *       khong reset mat khau nguoi khac duoc neu khong co dien thoai that
 *       cua Admin.
 */
const resetUserPassword = catchAsync(async (req, res, next) => {
  const { totpCode } = req.body;

  const secret = process.env.ADMIN_RESET_TOTP_SECRET;
  if (!secret) {
    return next(new AppError('Hệ thống chưa cấu hình ADMIN_RESET_TOTP_SECRET, vui lòng liên hệ kỹ thuật.', 500));
  }
  if (!verifyTotpCode(secret, totpCode)) {
    notifySecurityAlert({
      title: 'NHẬP SAI MÃ TOTP KHI RESET MẬT KHẨU',
      details: `Admin: <b>${req.user.username}</b>\nUser bị nhắm tới: <code>${req.params.id}</code>\nIP: <code>${req.ip}</code>`,
      severity: 'high',
    }).catch(() => {});
    return next(new AppError('Mã xác thực (TOTP) không đúng hoặc đã hết hạn.', 401));
  }

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

  const { username, email, balance } = user;
  await user.deleteOne();

  // Anti-crack: xoa tai khoan la thao tac khong the hoan tac, BAT BUOC phai
  // co thong bao Telegram de admin khac (neu co) va chinh nguoi thuc hien
  // deu co ban ghi lai, tranh truong hop tai khoan bi xoa "am tham".
  notifyUserDeleted({ username, email, adminUsername: req.user.username, balanceAtDeletion: balance }).catch(() => {});

  res.status(200).json({ success: true, message: 'Da xoa tai khoan.' });
});

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Admin thay doi vai tro tai khoan: 'user' / 'vip' / 'advisor'. KHONG
 *       cho phep gan/go quyen 'admin' qua route nay (tranh loi/lam dung tao
 *       them tai khoan admin ngoai y muon - viec do can thao tac truc tiep
 *       tren DB boi nguoi co quyen cao nhat).
 */
const updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'vip', 'advisor'].includes(role)) {
    return next(new AppError('Vai tro khong hop le. Chi ho tro "user", "vip" hoac "advisor".', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  if (user.role === 'admin') {
    return next(new AppError('Khong the thay doi vai tro cua tai khoan admin.', 403));
  }

  const oldRole = user.role;
  user.role = role;
  if (role === 'vip' && !user.vipSince) user.vipSince = new Date();
  if (role !== 'vip') user.vipSince = null;
  await user.save();

  if (oldRole !== role) {
    notifyRoleChanged({ username: user.username, adminUsername: req.user.username, oldRole, newRole: role }).catch(() => {});
  }

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

/**
 * @route PATCH /api/admin/users/:id/advisor-balance
 * @desc Admin dieu chinh THU CONG so du hoa hong cua 1 tai khoan Co van
 *       (cong them/tru bot 1 khoan, hoac dat lai ve dung 1 con so cu the).
 *       Khac hoan toan voi /balance (do la vi mua hang, khong lien quan).
 */
const adjustAdvisorBalance = catchAsync(async (req, res, next) => {
  const { amount, setExact, note } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  if (user.role !== 'advisor') return next(new AppError('Tai khoan nay khong phai Co van.', 400));

  const before = user.advisorBalance;

  if (setExact !== undefined && setExact !== null && setExact !== '') {
    const exact = Number(setExact);
    if (Number.isNaN(exact) || exact < 0) return next(new AppError('So tien khong hop le.', 400));
    user.advisorBalance = exact;
  } else {
    const delta = Number(amount);
    if (!delta || Number.isNaN(delta)) return next(new AppError('So tien khong hop le.', 400));
    user.advisorBalance = Math.max(0, user.advisorBalance + delta);
  }

  await user.save();

  notifyBalanceAdjusted({
    username: `${user.username} (Cố vấn)`,
    adminUsername: req.user.username,
    amount: user.advisorBalance - before,
    balanceBefore: before,
    balanceAfter: user.advisorBalance,
    note: note || 'Điều chỉnh số dư hoa hồng Cố vấn',
  }).catch(() => {});

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

/**
 * @route PATCH /api/admin/users/:id/advisor-rate
 * @desc Admin chinh % hoa hong (0-100) ma 1 tai khoan Co van nhan duoc tren
 *       moi giao dich nap tien thanh cong cua he thong.
 */
const updateAdvisorRate = catchAsync(async (req, res, next) => {
  const { ratePercent } = req.body;
  const percent = Number(ratePercent);

  if (Number.isNaN(percent) || percent < 0 || percent > 100) {
    return next(new AppError('Phần trăm hoa hồng phải từ 0 đến 100.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('Khong tim thay tai khoan.', 404));
  if (user.role !== 'advisor') return next(new AppError('Tai khoan nay khong phai Co van.', 400));

  user.advisorCommissionRate = percent / 100;
  await user.save();

  res.status(200).json({ success: true, data: user.toSafeObject() });
});

module.exports = {
  getAllUsers,
  getUserById,
  adjustUserBalance,
  adjustAdvisorBalance,
  updateAdvisorRate,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
  updateUserRole,
};
