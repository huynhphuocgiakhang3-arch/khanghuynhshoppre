const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const walletRoutes = require('./routes/wallet.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const AppError = require('./utils/AppError');

const app = express();

// Render (va hau het cac PaaS) chay app phia sau 1 reverse proxy, neu khong
// khai bao 'trust proxy', Express se lay sai IP cua nguoi dung (luon ra IP
// noi bo cua proxy), khien rate-limit theo IP bi tinh chung cho TAT CA nguoi
// truy cap thay vi tinh rieng cho moi nguoi - day la nguyen nhan gay loi
// "qua nhieu yeu cau" du chi co 1 nguoi thu dang nhap vai lan.
app.set('trust proxy', 1);

// ===== Security & utility middlewares =====
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limit tong quat, ap dung cho toan bo /api de chong brute-force/DDoS nho
// Rate limit tong quat, ap dung cho toan bo /api de chong brute-force/DDoS nho.
// Muc 600/15 phut (~40/phut) du rong rai cho nhu cau polling live-update cua
// frontend (AnnouncementBar, MusicPlayer, danh sach san pham...) ma van chan
// duoc tan cong DDoS quy mo lon.
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Ban da gui qua nhieu yeu cau, vui long thu lai sau.' },
});
app.use('/api', apiLimiter);

// Rate limit chat hon cho cac route auth (chong brute-force dang nhap)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Qua nhieu lan thu, vui long thu lai sau 15 phut.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ===== Health check =====
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Khanghuynh.shop API dang hoat dong.' });
});

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', publicRoutes); // /api/contact, /api/config/public
app.use('/api/admin', adminRoutes);

// ===== 404 handler =====
app.use((req, res, next) => {
  next(new AppError(`Khong tim thay duong dan: ${req.originalUrl}`, 404));
});

// ===== Global error handler (luon dat cuoi cung) =====
app.use(errorHandler);

module.exports = app;
