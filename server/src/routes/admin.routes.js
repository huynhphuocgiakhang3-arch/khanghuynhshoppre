const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');
const validate = require('../middlewares/validate.middleware');

const { getDashboardStats, getRevenueChart } = require('../controllers/admin.dashboard.controller');
const { verifyIdleLockPin } = require('../controllers/auth.controller');
const { generateTotpCode } = require('../utils/totp');
const {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  togglePinProduct,
} = require('../controllers/product.controller');
const {
  getAllUsers,
  getUserById,
  adjustUserBalance,
  adjustAdvisorBalance,
  updateAdvisorRate,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
  updateUserRole,
} = require('../controllers/admin.user.controller');
const { getAllOrdersAdmin } = require('../controllers/order.controller');
const {
  getConfig,
  updateBankConfig,
  updatePaymentGatewayConfig,
  updateAnnouncement,
  updatePopupAnnouncement,
  updateShopInfo,
  updateDepositLimits,
  updateMusicConfig,
} = require('../controllers/admin.config.controller');
const {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const {
  getAllCardTopups,
  approveCardTopup,
  rejectCardTopup,
} = require('../controllers/admin.cardTopup.controller');
const { getAllDeposits, approveDeposit, rejectDeposit } = require('../controllers/admin.deposit.controller');
const { testTelegramConnection, getTelegramStatus } = require('../controllers/admin.telegram.controller');
const {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  getAllServiceOrders,
  completeServiceOrder,
  cancelServiceOrder,
} = require('../controllers/admin.serviceOrder.controller');
const uploadRoutes = require('./upload.routes');
const { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/admin.coupon.controller');

const { productValidator } = require('../utils/validators/product.validator');
const { adjustBalanceValidator } = require('../utils/validators/common.validator');

// ===== Bao ve toan bo route ben duoi: phai dang nhap VA phai la admin =====
router.use(protect, adminOnly);

// ----- Dashboard -----
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/revenue-chart', getRevenueChart);
router.post('/verify-idle-pin', verifyIdleLockPin);

/**
 * @route GET /api/admin/debug-totp
 * @desc Cong cu CHAN DOAN: server tu tinh ma TOTP dung ADMIN_RESET_TOTP_SECRET
 *       dang cau hinh THUC SU tren server (khong phai gia tri ban tuong da
 *       set), roi so sanh voi ma tren dien thoai cua ban. Neu 2 ma nay KHAC
 *       nhau -> chac chan secret tren server KHONG khop voi secret ban da
 *       nhap vao app Authenticator (thuong do sua .env sai cho - xem lai
 *       huong dan trong .env.example). Neu 2 ma GIONG nhau ma van bao sai
 *       luc submit -> kiem tra lai gio he thong server (serverTime) co lech
 *       qua nhieu so voi dien thoai hay khong.
 */
router.get('/debug-totp', (req, res) => {
  const secret = process.env.ADMIN_RESET_TOTP_SECRET;
  if (!secret) {
    return res.status(200).json({ success: false, message: 'ADMIN_RESET_TOTP_SECRET chưa được cấu hình trên server.' });
  }
  res.status(200).json({
    success: true,
    currentServerCode: generateTotpCode(secret),
    serverTime: new Date().toISOString(),
    note: 'So sanh "currentServerCode" voi ma dang hien tren app Authenticator cua ban NGAY LUC NAY. Neu khac nhau -> secret tren server khong khop secret trong app. Neu giong nhau ma van bi tu choi -> kiem tra chenh lech gio he thong.',
  });
});

// ----- Quan ly san pham (CRUD) -----
router.get('/products', getAllProductsAdmin);
router.post('/products', productValidator, validate, createProduct);
router.put('/products/:id', productValidator, validate, updateProduct);
router.patch('/products/:id/pin', togglePinProduct);
router.delete('/products/:id', deleteProduct);

// ----- Quan ly don hang -----
router.get('/orders', getAllOrdersAdmin);

// ----- Quan ly user -----
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/balance', adjustBalanceValidator, validate, adjustUserBalance);
router.patch('/users/:id/advisor-balance', adjustAdvisorBalance);
router.patch('/users/:id/advisor-rate', updateAdvisorRate);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// ----- Cau hinh he thong -----
router.get('/config', getConfig);
router.put('/config/bank', updateBankConfig);
router.put('/config/payment-gateway', updatePaymentGatewayConfig);
router.put('/config/announcement', updateAnnouncement);
router.put('/config/popup-announcement', updatePopupAnnouncement);
router.put('/config/shop-info', updateShopInfo);
router.put('/config/deposit-limits', updateDepositLimits);
router.put('/config/music', updateMusicConfig);

// ----- Quan ly danh muc (category tuy chinh) -----
router.get('/categories', getAllCategoriesAdmin);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ----- Duyet the cao khach gui (thu cong) -----
router.get('/card-topups', getAllCardTopups);
router.patch('/card-topups/:id/approve', approveCardTopup);
router.patch('/card-topups/:id/reject', rejectCardTopup);

// ----- Duyet nap tien QR co anh xac nhan (thu cong) -----
router.get('/deposits', getAllDeposits);
router.patch('/deposits/:id/approve', approveDeposit);
router.patch('/deposits/:id/reject', rejectDeposit);

// ----- Test ket noi Telegram Bot -----
router.get('/telegram/status', getTelegramStatus);
router.post('/telegram/test', testTelegramConnection);

// ----- Quan ly chuc nang & don "Dat san pham" -----
router.get('/service-features', getAllFeatures);
router.post('/service-features', createFeature);
router.put('/service-features/:id', updateFeature);
router.delete('/service-features/:id', deleteFeature);

router.get('/service-orders', getAllServiceOrders);
router.patch('/service-orders/:id/complete', completeServiceOrder);
router.patch('/service-orders/:id/cancel', cancelServiceOrder);

// ----- Quan ly ma giam gia -----
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// ----- Upload file (anh san pham, file giao hang) -----
router.use('/upload', uploadRoutes);

module.exports = router;
