const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/admin/coupons
 */
const getAllCoupons = catchAsync(async (req, res) => {
  const coupons = await Coupon.find().populate('applicableProducts', 'name thumbnail').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: coupons });
});

/**
 * @route POST /api/admin/coupons
 */
const createCoupon = catchAsync(async (req, res, next) => {
  const { code, name, discountAmount, applyToAll, applicableProducts } = req.body;

  if (!code || !name || !discountAmount) {
    return next(new AppError('Vui lòng nhập đầy đủ mã, tên và số tiền giảm.', 400));
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const existing = await Coupon.findOne({ code: normalizedCode });
  if (existing) {
    return next(new AppError('Mã giảm giá này đã tồn tại, vui lòng chọn mã khác.', 400));
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    name: name.trim(),
    discountAmount: Number(discountAmount),
    applyToAll: applyToAll !== false,
    applicableProducts: applyToAll === false ? applicableProducts || [] : [],
  });

  res.status(201).json({ success: true, data: coupon });
});

/**
 * @route PUT /api/admin/coupons/:id
 */
const updateCoupon = catchAsync(async (req, res, next) => {
  const { code, name, discountAmount, applyToAll, applicableProducts, isActive } = req.body;

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError('Không tìm thấy mã giảm giá này.', 404));

  if (code !== undefined) {
    const normalizedCode = String(code).trim().toUpperCase();
    if (normalizedCode !== coupon.code) {
      const existing = await Coupon.findOne({ code: normalizedCode, _id: { $ne: coupon._id } });
      if (existing) return next(new AppError('Mã giảm giá này đã tồn tại, vui lòng chọn mã khác.', 400));
      coupon.code = normalizedCode;
    }
  }
  if (name !== undefined) coupon.name = name.trim();
  if (discountAmount !== undefined) coupon.discountAmount = Number(discountAmount);
  if (applyToAll !== undefined) coupon.applyToAll = applyToAll;
  if (applicableProducts !== undefined) coupon.applicableProducts = coupon.applyToAll ? [] : applicableProducts;
  if (isActive !== undefined) coupon.isActive = isActive;

  await coupon.save();
  res.status(200).json({ success: true, data: coupon });
});

/**
 * @route DELETE /api/admin/coupons/:id
 */
const deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Không tìm thấy mã giảm giá này.', 404));
  res.status(200).json({ success: true, message: 'Đã xóa mã giảm giá.' });
});

module.exports = { getAllCoupons, createCoupon, updateCoupon, deleteCoupon };
