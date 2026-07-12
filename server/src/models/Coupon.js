const mongoose = require('mongoose');

/**
 * Ma giam gia (coupon) do Admin tao thu cong tren trang quan tri. Giam theo
 * SO TIEN CO DINH (VND), khong phai theo %, ap dung cho 1 danh sach san
 * pham cu the HOAC toan bo san pham trong shop (applyToAll).
 */
const couponSchema = new mongoose.Schema(
  {
    // Ma khach se nhap luc mua hang, vd "KHAI TRUONG20K" - luon luu HOA de
    // so sanh khong phan biet hoa/thuong khi khach nhap.
    code: {
      type: String,
      required: [true, 'Mã giảm giá không được để trống'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    // Ten hien thi cho Admin de sau con nho ma nay dung cho dip gi, vd
    // "Giảm 20k mừng khai trương" - khong hien cho khach.
    name: {
      type: String,
      required: [true, 'Vui lòng đặt tên gợi nhớ cho mã giảm giá'],
      trim: true,
      maxlength: 100,
    },
    // So tien giam CO DINH tren tong gia tri cac san pham DU DIEU KIEN ap
    // dung trong don hang (khong phai % - xem giai thich chi tiet o
    // order.controller.js#applyCouponDiscount). Luon la so nguyen duong.
    discountAmount: {
      type: Number,
      required: [true, 'Vui lòng nhập số tiền giảm'],
      min: [1000, 'Số tiền giảm tối thiểu là 1.000đ'],
    },
    // true = ap dung cho TAT CA san pham dang ban. false = chi ap dung cho
    // danh sach applicableProducts ben duoi.
    applyToAll: { type: Boolean, default: true },
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    // Thong ke so lan da duoc su dung thanh cong - CHI de Admin theo doi,
    // hien khong dung de gioi han (co the bo sung usageLimit sau nay).
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
