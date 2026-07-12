const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { calculateCouponDiscount } = require('../utils/couponHelper');
const { isVipUser, getVipItemPrice } = require('../utils/pricing');

/**
 * @route POST /api/coupons/validate
 * @desc Kiem tra 1 ma giam gia co ap dung duoc cho gio hang hien tai khong,
 *       dung de hien preview "Ban duoc giam X d" NGAY khi khach bam "Áp
 *       dụng" - TRUOC khi thuc su tao don hang. Khong yeu cau dang nhap de
 *       khach xem truoc duoc muc giam ngay ca khi chua login.
 *       Body: { code, items: [{ productId, quantity, variantName? }] }
 */
const validateCoupon = catchAsync(async (req, res, next) => {
  const { code, items } = req.body;

  if (!code || !String(code).trim()) {
    return next(new AppError('Vui lòng nhập mã giảm giá.', 400));
  }
  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('Không có sản phẩm để áp dụng mã giảm giá.', 400));
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const isVip = isVipUser(req.user || null);

  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) return { productId: item.productId, itemTotal: 0 };

    const quantity = Number(item.quantity) || 1;
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    let basePrice = product.salePrice ?? product.price;
    if (hasVariants && item.variantName) {
      const variant = product.variants.find((v) => v.name === item.variantName);
      if (variant) basePrice = variant.salePrice ?? variant.price;
    }
    const finalPrice = getVipItemPrice(basePrice, isVip);
    return { productId: item.productId, itemTotal: finalPrice * quantity };
  });

  const { coupon, discountAmount, error } = await calculateCouponDiscount(code, orderItems);
  if (error) return next(new AppError(error, 400));

  res.status(200).json({
    success: true,
    data: { code: coupon.code, name: coupon.name, discountAmount },
  });
});

module.exports = { validateCoupon };
