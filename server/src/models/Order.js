const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    // Ten goi/variant da chon (vd: "1 thang"), de trong neu san pham khong co variants
    variantName: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      default: () => `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Don hang phai co it nhat 1 san pham',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Tong tien TRUOC khi ap dung giam gia VIP (de hien thi "gia goc" gach
    // ngang + "ban da tiet kiem X d"). Bang totalAmount neu khong phai VIP.
    originalTotalAmount: {
      type: Number,
      default: null,
    },
    // So tien VIP guest duoc giam them (giam thang 50k tren tong don, cong
    // don voi phan giam 50% tung san pham da phan anh trong totalAmount).
    vipDiscountAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'delivered', 'cancelled', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'bank_transfer'],
      default: 'wallet',
    },
    deliveredFiles: [{ type: String }], // link file da giao cho khach
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
