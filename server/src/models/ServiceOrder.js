const mongoose = require('mongoose');

/**
 * Don "Dat san pham": khach chon thiet bi (iOS/Android) + nhieu chuc nang,
 * he thong tru tien vi ngay khi dat (nhu mua hang), Admin xu ly thu cong roi
 * danh dau hoan thanh/huy (huy se hoan tien).
 */
const serviceOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    device: { type: String, enum: ['ios', 'android'], required: true },
    features: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    originalTotalPrice: { type: Number, default: null },
    vipDiscountAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

serviceOrderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceOrder', serviceOrderSchema);
