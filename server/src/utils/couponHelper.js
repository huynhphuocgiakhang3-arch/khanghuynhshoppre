const Coupon = require('../models/Coupon');

/**
 * Tinh so tien duoc giam boi 1 ma coupon cho 1 danh sach san pham dang mua.
 * DUNG CHUNG giua route validate cong khai (xem truoc muc giam) VA luc tao
 * don hang that su (order.controller.js) - dam bao 2 noi nay LUON tinh ra
 * cung 1 ket qua, tranh truong hop khach thay 1 muc giam luc "Ap dung ma"
 * nhung luc thanh toan that lai bi tinh khac.
 *
 * @param {string} code - Ma coupon khach nhap
 * @param {Array<{productId: string, quantity: number, itemTotal: number}>} orderItems
 *        - danh sach san pham trong don, itemTotal = gia * so luong CUA
 *        RIENG dong san pham do (da tinh gia VIP neu co)
 * @param {import('mongoose').ClientSession} [session] - session Mongo neu
 *        dang chay trong 1 transaction (luc tao don that su)
 * @returns {Promise<{coupon: object|null, discountAmount: number, error: string|null}>}
 */
const calculateCouponDiscount = async (code, orderItems, session = null) => {
  if (!code || !String(code).trim()) {
    return { coupon: null, discountAmount: 0, error: null };
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const query = Coupon.findOne({ code: normalizedCode });
  if (session) query.session(session);
  const coupon = await query;

  if (!coupon) return { coupon: null, discountAmount: 0, error: 'Mã giảm giá không tồn tại.' };
  if (!coupon.isActive) return { coupon: null, discountAmount: 0, error: 'Mã giảm giá này đã ngừng hoạt động.' };

  // Xac dinh cac dong san pham DU DIEU KIEN ap dung ma nay - neu applyToAll
  // thi toan bo don hang, nguoc lai chi nhung san pham co trong danh sach
  // applicableProducts cua coupon.
  const applicableProductIds = new Set((coupon.applicableProducts || []).map((id) => id.toString()));
  const eligibleItems = coupon.applyToAll
    ? orderItems
    : orderItems.filter((item) => applicableProductIds.has(String(item.productId)));

  if (eligibleItems.length === 0) {
    return { coupon: null, discountAmount: 0, error: 'Mã giảm giá này không áp dụng cho sản phẩm bạn đang mua.' };
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.itemTotal, 0);
  // Khong bao gio giam nhieu hon gia tri THAT SU cua cac san pham du dieu
  // kien - tranh truong hop 1 don hang re bi giam am tien (khong hop ly).
  const discountAmount = Math.min(coupon.discountAmount, eligibleSubtotal);

  return { coupon, discountAmount, error: null };
};

module.exports = { calculateCouponDiscount };
