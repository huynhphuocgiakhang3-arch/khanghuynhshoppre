const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../services/mail.service');
const { notifyNewUserRegistered, notifySecurityAlert } = require('../services/telegram.service');
const { isIpAllowed } = require('../middlewares/ipWhitelist.middleware');

// Username admin duy nhat cua he thong - KHONG BAO GIO cho phep dang nhap
// tai khoan nay tu 1 IP khong nam trong danh sach cho phep (ADMIN_ALLOWED_IPS),
// DU username/password co dung 100% di nua. Day la lop bao ve rieng cho
// chinh username nay, ngoai lop chan chung o middlewares/ipWhitelist cho
// toan bo /api/admin/* (phong khi ke tan cong co duoc access token bang
// cach khac va khong di qua luong login nay).
const RESERVED_ADMIN_USERNAME = 'khanghuynhadmintech23';

/** Tao response chuan chua user + token, dung lai cho register/login */
const sendAuthResponse = (res, statusCode, user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.status(statusCode).json({
    success: true,
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
};

/**
 * @route POST /api/auth/register
 */
const register = catchAsync(async (req, res, next) => {
  const { username, email, password, fullName } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return next(new AppError('Email hoac ten dang nhap da duoc su dung.', 409));
  }

  const user = await User.create({ username, email, password, fullName });

  sendWelcomeEmail(user).catch((err) => console.error('[Mail] Loi gui welcome email:', err.message));

  // Bat buoc gui thong bao Telegram MOI khi co tai khoan moi dang ky - chi
  // tiet gom username/email/IP/thoi gian de Admin theo doi & som phat hien
  // dau hieu dang ky spam/bot hang loat.
  notifyNewUserRegistered({
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch(() => {});

  sendAuthResponse(res, 201, user);
});

/**
 * @route POST /api/auth/login
 * @desc Dang nhap BUOC 1 (username/email + password). Voi tai khoan THUONG:
 *       tra ve token luon nhu binh thuong. Voi tai khoan ADMIN: KHONG tra
 *       token ngay - bat buoc phai qua BUOC 2 (nhap ma PIN bao mat rieng,
 *       xem verifyAdminPin ben duoi) truoc khi thuc su dang nhap duoc, DU
 *       mat khau da dung 100%.
 */
const login = catchAsync(async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  // Bao ve rieng cho DUNG username admin: neu ai do go dung username nay ma
  // KHONG dang o IP duoc cho phep, tu choi NGAY LAP TUC truoc ca khi kiem
  // tra mat khau - tranh do doan mat khau/brute-force nham vao chinh xac
  // tai khoan admin tu ben ngoai. Thong bao loi CHUNG CHUNG (giong het loi
  // sai mat khau binh thuong) de khong tiet lo cho ke tan cong biet ho vua
  // cham dung 1 lop bao ve rieng.
  if (String(emailOrUsername || '').trim().toLowerCase() === RESERVED_ADMIN_USERNAME && !isIpAllowed(req.ip)) {
    notifySecurityAlert({
      title: 'CÓ NGƯỜI CỐ ĐĂNG NHẬP TÀI KHOẢN ADMIN TỪ IP LẠ',
      details: `Username: <b>${emailOrUsername}</b>\nIP: <code>${req.ip}</code>\nThiết bị: ${req.headers['user-agent'] || 'N/A'}`,
      severity: 'critical',
    }).catch(() => {});
    return next(new AppError('Email/ten dang nhap hoac mat khau khong dung.', 401));
  }

  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Email/ten dang nhap hoac mat khau khong dung.', 401));
  }

  if (user.status === 'banned') {
    return next(new AppError('Tai khoan cua ban da bi khoa. Vui long lien he ho tro.', 403));
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip;
  await user.save({ validateBeforeSave: false });

  // Tai khoan ADMIN: mat khau dung roi nhung CHUA duoc dang nhap that su -
  // phai qua buoc nhap PIN bao mat (xem verifyAdminPin). Tra ve 1 token TAM
  // (het han sau 5 phut, chi dung de xac nhan buoc 2, khong dung de goi bat
  // ky API nao khac) thay vi accessToken that.
  if (user.role === 'admin') {
    const pendingToken = jwt.sign({ id: user._id, purpose: 'admin_pin_pending' }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });
    return res.status(200).json({
      success: true,
      requiresPin: true,
      pendingToken,
      message: 'Vui lòng nhập mã PIN bảo mật để hoàn tất đăng nhập.',
    });
  }

  sendAuthResponse(res, 200, user);
});

/**
 * @route POST /api/auth/verify-admin-pin
 * @desc BUOC 2 cua dang nhap admin: xac thuc ma PIN bao mat (mot day so dai,
 *       cau hinh trong .env bien ADMIN_SECURITY_PIN, chi minh Admin biet).
 *       Dung PIN + pendingToken con hop le -> moi thuc su cap accessToken.
 */
const verifyAdminPin = catchAsync(async (req, res, next) => {
  const { pendingToken, pin } = req.body;
  if (!pendingToken || !pin) return next(new AppError('Thieu thong tin xac thuc.', 400));

  const securityPin = process.env.ADMIN_SECURITY_PIN;
  if (!securityPin) {
    return next(new AppError('Hệ thống chưa cấu hình mã PIN bảo mật (ADMIN_SECURITY_PIN), vui lòng liên hệ kỹ thuật.', 500));
  }

  let decoded;
  try {
    decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Phiên xác thực đã hết hạn, vui lòng đăng nhập lại từ đầu.', 401));
  }
  if (decoded.purpose !== 'admin_pin_pending') {
    return next(new AppError('Token không hợp lệ.', 400));
  }

  // So sanh PIN bang timingSafeEqual de tranh timing attack (do do dai
  // response time doan tung ky tu cua PIN) - PIN cang dai cang nen so sanh
  // kieu nay thay vi `===` thong thuong.
  const inputBuf = Buffer.from(String(pin));
  const secretBuf = Buffer.from(String(securityPin));
  const isMatch =
    inputBuf.length === secretBuf.length && crypto.timingSafeEqual(inputBuf, secretBuf);

  if (!isMatch) {
    notifySecurityAlert({
      title: 'NHẬP SAI MÃ PIN BẢO MẬT KHI ĐĂNG NHẬP ADMIN',
      details: `IP: <code>${req.ip}</code>\nThiết bị: ${req.headers['user-agent'] || 'N/A'}`,
      severity: 'high',
    }).catch(() => {});
    return next(new AppError('Mã PIN không đúng.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('Tai khoan khong ton tai.', 401));

  sendAuthResponse(res, 200, user);
});

/**
 * @route POST /api/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) return next(new AppError('Thieu refresh token.', 400));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    return next(new AppError('Refresh token khong hop le hoac da het han.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('Tai khoan khong ton tai.', 401));

  const accessToken = generateAccessToken(user._id, user.role);
  res.status(200).json({ success: true, data: { accessToken } });
});

/**
 * @route GET /api/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeObject() } });
});

/**
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Khong tiet lo email co ton tai hay khong, tranh do quet tai khoan
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'Neu email ton tai trong he thong, ban se nhan duoc huong dan dat lai mat khau.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phut
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendResetPasswordEmail(user, resetUrl);

  res.status(200).json({
    success: true,
    message: 'Neu email ton tai trong he thong, ban se nhan duoc huong dan dat lai mat khau.',
  });
});

/**
 * @route POST /api/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return next(new AppError('Token khong hop le hoac da het han.', 400));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Dat lai mat khau thanh cong. Vui long dang nhap lai.' });
});

/**
 * @route POST /api/admin/verify-idle-pin
 * @desc Dung cho man hinh "khoa tam thoi" o client: sau 5 phut Admin khong
 *       thao tac gi tren trang admin, giao dien se hien 1 lop khoa yeu cau
 *       nhap lai dung ma PIN nay moi cho xem tiep (khong dang xuat, khong
 *       can dang nhap lai tu dau - chi la 1 lop khoa man hinh). Route nay
 *       da nam duoi 2 lop bao ve: `protect` (phai co access token con hop
 *       le) + `adminOnly` (phai la admin) o admin.routes.js.
 */
const verifyIdleLockPin = catchAsync(async (req, res, next) => {
  const { pin } = req.body;
  const securityPin = process.env.ADMIN_SECURITY_PIN;
  if (!securityPin) return next(new AppError('Hệ thống chưa cấu hình mã PIN bảo mật.', 500));

  const inputBuf = Buffer.from(String(pin || ''));
  const secretBuf = Buffer.from(String(securityPin));
  const isMatch = inputBuf.length === secretBuf.length && crypto.timingSafeEqual(inputBuf, secretBuf);

  if (!isMatch) return next(new AppError('Mã PIN không đúng.', 401));

  res.status(200).json({ success: true, message: 'Đã mở khóa.' });
});

module.exports = { register, login, verifyAdminPin, verifyIdleLockPin, refreshToken, getMe, forgotPassword, resetPassword };
