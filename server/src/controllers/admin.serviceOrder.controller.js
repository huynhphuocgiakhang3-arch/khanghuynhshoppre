const ServiceFeature = require('../models/ServiceFeature');
const ServiceOrder = require('../models/ServiceOrder');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ===== Quan ly chuc nang (ServiceFeature) =====

const getAllFeatures = catchAsync(async (req, res) => {
  const features = await ServiceFeature.find().sort('order');
  res.status(200).json({ success: true, data: features });
});

const createFeature = catchAsync(async (req, res, next) => {
  const { name, price, order } = req.body;
  if (!name || !String(name).trim()) return next(new AppError('Vui long nhap ten chuc nang.', 400));
  if (price === undefined || Number(price) < 0) return next(new AppError('Gia khong hop le.', 400));

  const feature = await ServiceFeature.create({ name: String(name).trim(), price: Number(price), order: order || 0 });
  res.status(201).json({ success: true, data: feature });
});

const updateFeature = catchAsync(async (req, res, next) => {
  const { name, price, order, isActive } = req.body;
  const feature = await ServiceFeature.findById(req.params.id);
  if (!feature) return next(new AppError('Khong tim thay chuc nang.', 404));

  if (name !== undefined) feature.name = String(name).trim();
  if (price !== undefined) feature.price = Number(price);
  if (order !== undefined) feature.order = Number(order);
  if (isActive !== undefined) feature.isActive = isActive;

  await feature.save();
  res.status(200).json({ success: true, data: feature });
});

const deleteFeature = catchAsync(async (req, res, next) => {
  const feature = await ServiceFeature.findByIdAndDelete(req.params.id);
  if (!feature) return next(new AppError('Khong tim thay chuc nang.', 404));
  res.status(200).json({ success: true, message: 'Da xoa chuc nang.' });
});

// ===== Quan ly don dat dich vu (ServiceOrder) =====

const getAllServiceOrders = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    ServiceOrder.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).populate('user', 'username email'),
    ServiceOrder.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/** Danh dau don da hoan thanh (khong dong tien, chi cap nhat trang thai) */
const completeServiceOrder = catchAsync(async (req, res, next) => {
  const order = await ServiceOrder.findById(req.params.id);
  if (!order) return next(new AppError('Khong tim thay don.', 404));
  if (order.status !== 'pending') return next(new AppError('Don nay da duoc xu ly truoc do.', 400));

  order.status = 'completed';
  order.processedBy = req.user._id;
  order.processedAt = new Date();
  await order.save();

  res.status(200).json({ success: true, data: order });
});

/** Huy don + hoan tien lai vao vi cho khach */
const cancelServiceOrder = catchAsync(async (req, res, next) => {
  const { note } = req.body;
  const order = await ServiceOrder.findById(req.params.id);
  if (!order) return next(new AppError('Khong tim thay don.', 404));
  if (order.status !== 'pending') return next(new AppError('Don nay da duoc xu ly truoc do.', 400));

  const user = await User.findById(order.user);
  if (user) {
    const balanceBefore = user.balance;
    user.balance += order.totalPrice;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'refund',
      amount: order.totalPrice,
      balanceBefore,
      balanceAfter: user.balance,
      status: 'success',
      method: 'system',
      note: `Hoàn tiền đơn dịch vụ bị huỷ${note ? `: ${note}` : ''}`,
    });
  }

  order.status = 'cancelled';
  order.adminNote = note || '';
  order.processedBy = req.user._id;
  order.processedAt = new Date();
  await order.save();

  res.status(200).json({ success: true, data: order });
});

module.exports = {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  getAllServiceOrders,
  completeServiceOrder,
  cancelServiceOrder,
};
