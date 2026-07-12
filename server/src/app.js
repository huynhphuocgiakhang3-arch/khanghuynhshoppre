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
const serviceOrderRoutes = require('./routes/serviceOrder.routes');
const paymentRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');
const checkPaymentRoutes = require('./routes/checkPayment.routes');
const adminRoutes = require('./routes/admin.routes');
const advisorRoutes = require('./routes/advisor.routes');
const couponRoutes = require('./routes/coupon.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const sanitizeInput = require('./middlewares/sanitizeInput.middleware');
const AppError = require('./utils/AppError');

const app = express();

// Render (va hau het cac PaaS) chay app phia sau 1 HOAC NHIEU lop reverse
// proxy - neu khai bao sai so lop (vd chi '1' nhung thuc te co 2-3 lop),
// Express se lay NHAM ra 1 IP noi bo cua chinh proxy (thuong la dai IP rieng
// 10.x.x.x / 172.16-31.x.x / 192.168.x.x) thay vi IP that cua nguoi dung -
// day CHINH XAC la loi da xay ra (IP bao ve "10.24.179.3" la IP noi bo, chac
// chan khong phai IP that cua ai ca). Dung `true` de tin TOAN BO chuoi
// X-Forwarded-For va luon lay dung IP ngoai cung ben trai (IP goc cua trinh
// duyet) - day la cach Render chinh thuc khuyen dung de tranh loi nay.
app.set('trust proxy', true);

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
app.use(sanitizeInput); // Chong NoSQL injection ($ne, $where, $gt... trong body/query/params)

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limit tong quat, ap dung cho toan bo /api de chong brute-force/DDoS nho.
//
// TRUOC DAY: dem CA request thanh cong lan that bai chung vao 1 quota
// 600/15 phut cho moi IP. Frontend co nhieu widget tu poll dinh ky (banner
// khuyen mai, may nghe nhac, kiem tra ton kho, thong bao don hang...) nen
// mot nguoi dung binh thuong mo trang vai chuc phut la co the da dung gan
// het quota nay - dac biet o VN rat nhieu nha mang di dong dung CGNAT
// (hang tram nguoi dung khac nhau cung chung 1 dia chi IP cong khai), nen
// chi can vai nguoi trong cung mang di dong la da lam CA NHOM do bi khoa
// oan, du tung nguoi rieng le khong he spam gi ca. Day chinh la nguyen
// nhan gay loi "Ban da gui qua nhieu yeu cau" xuat hien voi nguoi dung binh
// thuong dang co gang dang nhap.
//
// SUA LAI: chi tinh vao quota nhung request THAT BAI (status >= 400) nho
// `skipSuccessfulRequests: true`. Traffic doc du lieu (GET) hop le hau het
// deu tra ve thanh cong nen se KHONG con bi dem nua - quota gio chi dung
// de chan cac chuoi request LIEN TUC BI LOI (dau hieu dac trung cua tan
// cong do/brute-force/bot quet loi), khong con anh huong toi nguoi dung
// that dang duyet web/dang nhap binh thuong. Nang muc max len cao hon lam
// bien an toan, va key theo IP nhu cu.
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Ban da gui qua nhieu yeu cau, vui long thu lai sau.' },
});
app.use('/api', apiLimiter);

// Rate limit chat hon cho cac route auth (chong brute-force dang nhap).
//
// Cung ly do nhu tren (CGNAT o VN khien nhieu nguoi dung that su cung chia
// se 1 IP): thay vi khoa theo IP don thuan, key duoc ghep them ten dang
// nhap ho go (neu co) - nen viec 1 nguoi go SAI mat khau lien tuc CHI khoa
// rieng viec thu lai VOI CHINH TAI KHOAN DO tu IP nay, khong lam anh huong
// toi nhung nguoi khac (dang dung IP chung) dang dang nhap dung tai khoan
// cua ho. Dong thoi chi dem LAN THAT BAI (skipSuccessfulRequests) - dang
// nhap dung ngay lan dau khong bao gio bi tinh vao quota nay ca, du truoc
// do IP nay da co bao nhieu luot dang nhap thanh cong khac.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const account = String(req.body?.identifier || req.body?.email || req.body?.username || '').toLowerCase().trim();
    return account ? `${req.ip}:${account}` : req.ip;
  },
  message: { success: false, message: 'Qua nhieu lan thu, vui long thu lai sau 15 phut.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rate limit rieng, chat hon cho cac route lien quan truc tiep den TIEN
// (dieu chinh so du, xoa tai khoan, duyet nap tien...) - chong kich ban tu
// dong spam thao tac nhay cam ke ca khi da co token admin hop le (vd token
// bi lo/danh cap). Chi tinh request LOI (skipSuccessfulRequests) de Admin
// thao tac hang loat binh thuong (vd duyet nhieu don lien tiep) khong bi
// chan oan.
const sensitiveActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Thao tác nhạy cảm bị giới hạn tần suất, vui lòng thử lại sau ít phút.' },
});
app.use('/api/admin/users', sensitiveActionLimiter);
app.use('/api/admin/card-topups', sensitiveActionLimiter);
app.use('/api/admin/deposits', sensitiveActionLimiter);
app.use('/api/admin/coupons', sensitiveActionLimiter);

// ===== Health check =====
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Khanghuynh.shop API dang hoat dong.' });
});

const restrictAdminIp = require('./middlewares/ipWhitelist.middleware');

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', publicRoutes); // /api/contact, /api/config/public
app.use('/api', checkPaymentRoutes); // /api/check-payment (VietQR polling tu dong qua SePay)
app.use('/api/admin', restrictAdminIp, adminRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/coupons', couponRoutes);

// ===== 404 handler =====
app.use((req, res, next) => {
  next(new AppError(`Khong tim thay duong dan: ${req.originalUrl}`, 404));
});

// ===== Global error handler (luon dat cuoi cung) =====
app.use(errorHandler);

module.exports = app;
