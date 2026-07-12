const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendTelegramMessage } = require('../services/telegram.service');

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

/**
 * @route GET /api/advisor/me
 * @desc Tra ve DUY NHAT so du hoa hong hien tai cua Co van (khong tra ve
 *       thong tin nao khac - trang Co van chi hien 1 o duy nhat nay).
 */
const getAdvisorBalance = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { balance: req.user.advisorBalance } });
});

/**
 * @route POST /api/advisor/withdraw
 * @desc Co van bam nut "Rut tien": KHONG tu dong chuyen khoan (he thong
 *       khong tich hop cong thanh toan tra tien tu dong) - chi gui THONG
 *       BAO CHI TIET qua Telegram cho Admin biet de Admin TU TAY chuyen
 *       khoan ra ben ngoai, sau do so du hoa hong duoc dua ve 0 de bat dau
 *       tinh lai tu dau cho ky tiep theo.
 */
const requestWithdraw = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.advisorBalance <= 0) {
    return next(new AppError('Số dư hoa hồng hiện tại là 0đ, chưa thể rút.', 400));
  }

  const withdrawAmount = user.advisorBalance;
  user.advisorBalance = 0;
  await user.save();

  await sendTelegramMessage(
    `💼 <b>YÊU CẦU RÚT HOA HỒNG CỐ VẤN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Cố vấn: <b>${user.username}</b> (${user.email})\n` +
      `💰 Số tiền cần chuyển: <b>${vnd(withdrawAmount)}</b>\n` +
      `🕒 ${new Date().toLocaleString('vi-VN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👉 Vui lòng tự chuyển khoản số tiền trên cho Cố vấn qua kênh bên ngoài hệ thống.`
  ).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Đã gửi yêu cầu rút ${vnd(withdrawAmount)}. Admin sẽ chuyển khoản cho bạn sớm nhất.`,
    data: { balance: user.advisorBalance },
  });
});

module.exports = { getAdvisorBalance, requestWithdraw };
