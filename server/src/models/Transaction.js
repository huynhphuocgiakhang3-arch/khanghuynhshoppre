const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema(
  {
    transactionCode: {
      type: String,
      unique: true,
      default: () => `TX${Date.now()}${uuidv4().split('-')[0].toUpperCase()}`,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'purchase', 'refund', 'admin_adjust'],
      required: true,
    },
    amount: {
      // Duong: cong tien, Am: tru tien (luu dau so de de tinh tong)
      type: Number,
      required: true,
    },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['vietqr', 'bank_transfer', 'card', 'manual', 'system'],
      default: 'manual',
    },
    // Noi dung chuyen khoan duoc sinh ra de khach ghi vao khi CK,
    // dung de he thong/webhook doi soat tu dong
    transferContent: {
      type: String,
      index: true,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    gatewayRef: {
      // ID giao dich tra ve tu cong thanh toan (SePay/Casso/PayOS...)
      type: String,
      default: null,
    },
    note: { type: String, default: '' },
    // Anh chup man hinh xac nhan chuyen khoan do khach tu upload (dung khi
    // Admin duyet thu cong, khong co webhook tu dong doi soat)
    proofImage: { type: String, default: '' },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
