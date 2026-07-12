const CardTopup = require('../models/CardTopup');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { notifyNewCardTopup } = require('../services/telegram.service');

const ALLOWED_AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000];

/**
 * @route POST /api/wallet/card-topup
 * @desc Khach gui thong tin the cao (ten the, menh gia, seri, ma) de Admin
 *       duyet thu cong. KHONG cong tien ngay - trang thai luon la 'pending'
 *       cho toi khi Admin xu ly, khach xem trang thai that trong lich su.
 */
const submitCardTopup = catchAsync(async (req, res, next) => {
  const { cardType, amount, serial, code } = req.body;
  const numericAmount = Number(amount);

  if (!cardType || !String(cardType).trim()) {
    return next(new AppError('Vui long chon loai the cao.', 400));
  }
  if (!ALLOWED_AMOUNTS.includes(numericAmount)) {
    return next(new AppError('Menh gia the khong hop le.', 400));
  }
  if (!serial || !String(serial).trim() || !code || !String(code).trim()) {
    return next(new AppError('Vui long nhap day du seri va ma the.', 400));
  }

  const cardTopup = await CardTopup.create({
    user: req.user._id,
    cardType: String(cardType).trim(),
    amount: numericAmount,
    serial: String(serial).trim(),
    code: String(code).trim(),
    cardImage: req.file ? req.file.path : '',
  });

  // Ban thong bao Telegram khong lam cham/fail response chinh neu Telegram loi
  notifyNewCardTopup(cardTopup, req.user.username).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Đã gửi thẻ thành công, vui lòng chờ Admin kiểm tra và duyệt trong ít phút.',
    data: { id: cardTopup._id, status: cardTopup.status },
  });
});

/**
 * @route GET /api/wallet/card-topup/mine
 * @desc Lich su nap the cua chinh user dang dang nhap
 */
const getMyCardTopups = catchAsync(async (req, res) => {
  const topups = await CardTopup.find({ user: req.user._id })
    .sort('-createdAt')
    .limit(50)
    .select('-code -serial'); // khong tra lai seri/ma the ve client sau khi da gui, tranh lo lieu qua lai tren man hinh

  res.status(200).json({ success: true, data: topups });
});

module.exports = { submitCardTopup, getMyCardTopups, ALLOWED_AMOUNTS };
