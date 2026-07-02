const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');
const validate = require('../middlewares/validate.middleware');

const { getDashboardStats, getRevenueChart } = require('../controllers/admin.dashboard.controller');
const {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const {
  getAllUsers,
  getUserById,
  adjustUserBalance,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/admin.user.controller');
const { getAllOrdersAdmin } = require('../controllers/order.controller');
const {
  getConfig,
  updateBankConfig,
  updatePaymentGatewayConfig,
  updateAnnouncement,
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
const uploadRoutes = require('./upload.routes');

const { productValidator } = require('../utils/validators/product.validator');
const { adjustBalanceValidator } = require('../utils/validators/common.validator');

// ===== Bao ve toan bo route ben duoi: phai dang nhap VA phai la admin =====
router.use(protect, adminOnly);

// ----- Dashboard -----
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/revenue-chart', getRevenueChart);

// ----- Quan ly san pham (CRUD) -----
router.get('/products', getAllProductsAdmin);
router.post('/products', productValidator, validate, createProduct);
router.put('/products/:id', productValidator, validate, updateProduct);
router.delete('/products/:id', deleteProduct);

// ----- Quan ly don hang -----
router.get('/orders', getAllOrdersAdmin);

// ----- Quan ly user -----
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/balance', adjustBalanceValidator, validate, adjustUserBalance);
router.patch('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// ----- Cau hinh he thong -----
router.get('/config', getConfig);
router.put('/config/bank', updateBankConfig);
router.put('/config/payment-gateway', updatePaymentGatewayConfig);
router.put('/config/announcement', updateAnnouncement);
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

// ----- Upload file (anh san pham, file giao hang) -----
router.use('/upload', uploadRoutes);

module.exports = router;
