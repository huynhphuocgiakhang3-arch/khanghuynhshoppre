/**
 * ===========================================================================
 * QUY DINH UU DAI VIP GUEST (nguon chan ly DUY NHAT - chi tinh o server,
 * KHONG BAO GIO tin tuong gia/tong tien do client gui len)
 * ===========================================================================
 * 1) MUA HANG TRONG SHOP (Order): giam 50% cho MOI SAN PHAM co gia > 50.000d,
 *    ap dung tren tung san pham/variant. KHONG co giam gia them tren tong don.
 *
 * 2) DAT HANG / DAT DICH VU (ServiceOrder, muc "Dat san pham"): giam THANG
 *    50.000d tren TONG tien don, nhung CHI ap dung khi tong tien GOC (truoc
 *    giam) LON HON 200.000d. Don <= 200.000d khong duoc giam khoan nay.
 */

const VIP_ITEM_DISCOUNT_THRESHOLD = 50000; // san pham gia > 50k moi duoc giam 50%
const VIP_ITEM_DISCOUNT_RATE = 0.5;
const VIP_ORDER_FLAT_DISCOUNT = 50000; // giam thang 50k tren tong don dat hang
const VIP_ORDER_DISCOUNT_MIN_TOTAL = 200000; // chi ap dung khi don dat hang > 200k

/** User co dang huong uu dai VIP hay khong (VIP hoac admin - admin coi nhu VIP luon) */
const isVipUser = (user) => Boolean(user) && (user.role === 'vip' || user.role === 'admin');

/**
 * Tra ve gia THAT SU phai tra cho 1 san pham/variant, da ap dung giam 50%
 * VIP neu du dieu kien (gia goc > 50.000d). Lam tron xuong hang don vi de
 * tranh so le.
 */
const getVipItemPrice = (basePrice, isVip) => {
  const price = Number(basePrice) || 0;
  if (isVip && price > VIP_ITEM_DISCOUNT_THRESHOLD) {
    return Math.round(price * (1 - VIP_ITEM_DISCOUNT_RATE));
  }
  return price;
};

/**
 * CHI dung cho luong "Dat hang / Dat dich vu" (ServiceOrder). Ap dung giam
 * thang 50.000d tren tong don cho VIP, NHUNG CHI KHI tong tien GOC (truoc
 * giam) > 200.000d - don nho hon hoac bang 200k khong duoc giam khoan nay.
 * Tra ve { finalAmount, discountAmount } de con luu lai (hien thi "da tiet
 * kiem X d" cho khach thay uu dai ro rang).
 */
const applyVipOrderDiscount = (totalAmount, isVip) => {
  const amount = Number(totalAmount) || 0;

  if (!isVip || amount <= VIP_ORDER_DISCOUNT_MIN_TOTAL) {
    return { finalAmount: amount, discountAmount: 0 };
  }

  const finalAmount = Math.max(0, amount - VIP_ORDER_FLAT_DISCOUNT);
  const discountAmount = amount - finalAmount;
  return { finalAmount, discountAmount };
};

module.exports = {
  VIP_ITEM_DISCOUNT_THRESHOLD,
  VIP_ITEM_DISCOUNT_RATE,
  VIP_ORDER_FLAT_DISCOUNT,
  VIP_ORDER_DISCOUNT_MIN_TOTAL,
  isVipUser,
  getVipItemPrice,
  applyVipOrderDiscount,
};
