const mongoose = require('mongoose');

/**
 * Category cho phep Admin tu quan ly danh sach loai san pham (truoc day
 * bi gioi han cung trong enum: account/item/skin/diamond/tool/other).
 * slug dung de luu trong Product.category, name dung de hien thi.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui long nhap ten danh muc'],
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
