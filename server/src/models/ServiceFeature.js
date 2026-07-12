const mongoose = require('mongoose');

/**
 * Danh sach cac "chuc nang" (buff/toi uu...) ma khach co the tich chon khi
 * dat dich vu tuy chinh (trang "Dat san pham"). Admin toan quyen them/sua/xoa
 * va doi gia tu trang Admin, khong hardcode cung frontend.
 */
const serviceFeatureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // thu tu hien thi
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceFeature', serviceFeatureSchema);
