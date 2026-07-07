const mongoose = require('mongoose');

/**
 * Luu cac lan khach nap tien bang the cao. Day la co che DUYET THU CONG:
 * khach gui thong tin the -> Admin tu kiem tra tren cong/tong dai rieng cua
 * shop -> Admin bam "Duyet thanh cong" (cong tien) hoac "Tu choi" (khong
 * cong gi). Khong co buoc tu dong "gach the" nao ca - dam bao minh bach,
 * khach luon thay dung trang thai that cua the minh da gui.
 */
const cardTopupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardType: {
      // Ten loai the cao, vd: Viettel, Mobifone, Vinaphone, Zing, Garena...
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      // Menh gia the (VND) - so tien se duoc cong neu duyet thanh cong
      type: Number,
      required: true,
      min: 10000,
      max: 500000,
    },
    serial: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      // Ma the / pin
      type: String,
      required: true,
      trim: true,
    },
    // Anh chup the cao (mat truoc/sau) do khach tu upload - KHONG bat buoc,
    // dung de Admin doi chieu truc quan hon truoc khi duyet (giam ty le
    // duyet nham the sai/da su dung).
    cardImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      // Ly do tu choi hoac ghi chu cua Admin khi duyet
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    relatedTransaction: {
      // Tro toi Transaction duoc tao khi duyet thanh cong (de doi soat)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  { timestamps: true }
);

cardTopupSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CardTopup', cardTopupSchema);
