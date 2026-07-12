const ServiceFeature = require('../models/ServiceFeature');
const ServiceOrder = require('../models/ServiceOrder');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { isVipUser, applyVipOrderDiscount } = require('../utils/pricing');
const { notifyNewPurchase } = require('../services/telegram.service');
const { checkBalanceAnomaly } = require('../services/antiCrack.service');

const DEFAULT_FEATURES = [
  { name: 'Nhẹ Tâm', price: 20000, order: 1 },
  { name: 'Fix Rung', price: 20000, order: 2 },
  { name: 'Fix Lố', price: 20000, order: 3 },
  { name: 'Tăng Nhạy', price: 20000, order: 4 },
  { name: 'Đầm Tâm', price: 20000, order: 5 },
  { name: 'Tối Ưu Thiết Bị', price: 25000, order: 6 },
  { name: 'Bám Đầu', price: 25000, order: 7 },
  { name: 'Chạy Code Ẩn', price: 30000, order: 8 },
  { name: 'Tăng Tốc Độ Vuốt Màn Hình', price: 20000, order: 9 },
];

/**
 * @route GET /api/service-features
 * @desc Danh sach chuc nang dang active de khach chon o trang "Dat san pham".
 *       Neu DB chua co du lieu nao (lan dau chay), tu dong seed bo mac dinh
 *       9 chuc nang - Admin sau do toan quyen sua/xoa/them tai trang Admin.
 */
const getActiveFeatures = catchAsync(async (req, res) => {
  const count = await ServiceFeature.countDocuments();
  if (count === 0) {
    await ServiceFeature.insertMany(DEFAULT_FEATURES);
  }

  const features = await ServiceFeature.find({ isActive: true }).sort('order');
  res.status(200).json({ success: true, data: features });
});

/**
 * @route POST /api/service-orders
 * @desc Khach dat dich vu tuy chinh: chon thiet bi + nhieu chuc nang, tru
 *       tien vi ngay (nhu mua hang), tao ServiceOrder cho Admin xu ly.
 */
const createServiceOrder = catchAsync(async (req, res, next) => {
  const { device, featureIds } = req.body;

  if (!['ios', 'android'].includes(device)) {
    return next(new AppError('Vui long chon thiet bi IOS hoac Android.', 400));
  }
  if (!Array.isArray(featureIds) || featureIds.length === 0) {
    return next(new AppError('Vui long chon it nhat 1 chuc nang.', 400));
  }

  const features = await ServiceFeature.find({ _id: { $in: featureIds }, isActive: true });
  if (features.length === 0) {
    return next(new AppError('Cac chuc nang da chon khong hop le.', 400));
  }

  const originalTotalPrice = features.reduce((sum, f) => sum + f.price, 0);

  const user = await User.findById(req.user._id);

  // VIP guest: giam thang 50.000d tren tong tien dat dich vu (khong ap dung
  // giam 50% tung chuc nang - dieu do chi danh cho san pham trong shop).
  const isVip = isVipUser(user);
  const { finalAmount: totalPrice, discountAmount } = applyVipOrderDiscount(originalTotalPrice, isVip);

  if (user.balance < totalPrice) {
    return next(new AppError('So du khong du, vui long nap them tien.', 400));
  }

  const balanceBefore = user.balance;
  user.balance -= totalPrice;
  await user.save();

  const serviceOrder = await ServiceOrder.create({
    user: user._id,
    device,
    features: features.map((f) => ({ name: f.name, price: f.price })),
    totalPrice,
    originalTotalPrice,
    vipDiscountAmount: discountAmount,
  });

  await Transaction.create({
    user: user._id,
    type: 'purchase',
    amount: totalPrice,
    balanceBefore,
    balanceAfter: user.balance,
    status: 'success',
    method: 'system',
    note: `Đặt dịch vụ (${device === 'ios' ? 'iOS' : 'Android'}): ${features.map((f) => f.name).join(', ')}`,
  });

  notifyNewPurchase(serviceOrder, user, { isVip, discountAmount, isServiceOrder: true }).catch(() => {});
  checkBalanceAnomaly(user, balanceBefore, user.balance, 'service_order').catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Đặt dịch vụ thành công, vui lòng chờ xử lý.',
    data: serviceOrder,
  });
});

/**
 * @route GET /api/service-orders/mine
 */
const getMyServiceOrders = catchAsync(async (req, res) => {
  const orders = await ServiceOrder.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.status(200).json({ success: true, data: orders });
});

module.exports = { getActiveFeatures, createServiceOrder, getMyServiceOrders };
