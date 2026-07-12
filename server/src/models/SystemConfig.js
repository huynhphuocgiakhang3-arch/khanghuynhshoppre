const mongoose = require('mongoose');

/**
 * SystemConfig la mot document duy nhat (singleton) luu toan bo cau hinh
 * dong cua he thong, co the sua truc tiep tu trang Admin ma KHONG can
 * restart server hay sua file .env.
 */
const systemConfigSchema = new mongoose.Schema(
  {
    // ===== Thong tin ngan hang nhan tien (dung de tao QR chuyen khoan TPBank) =====
    bank: {
      bin: { type: String, default: '970423' }, // Ma BIN VietQR cua TPBank
      bankName: { type: String, default: 'TPBank' },
      accountNo: { type: String, default: '10002181284' },
      accountName: { type: String, default: 'HUYNH PHUOC GIA AN' },
      template: { type: String, default: 'compact' }, // template hien thi QR
      // Ghi chu hien duoi ma QR khi khach nap tien, Admin co the sua truc tiep
      depositNote: {
        type: String,
        default: 'Nếu chuyển tiền rồi mà vẫn không cộng số dư liên hệ Zalo admin để được hỗ trợ nhé',
      },
      // Anh QR tuy chinh do Admin tu upload (vd anh chup QR that tu app ngan
      // hang), neu co se UU TIEN hien thi thay cho QR sinh tu dong qua VietQR.
      customQrImage: { type: String, default: '' },
      customQrImagePublicId: { type: String, default: '' },
    },

    // ===== Cau hinh cong thanh toan tu dong doi soat (SePay/Casso/PayOS...) =====
    paymentGateway: {
      provider: {
        type: String,
        enum: ['manual', 'sepay', 'casso', 'payos', 'other'],
        default: 'manual',
      },
      apiKey: { type: String, default: '', select: false },
      apiSecret: { type: String, default: '', select: false },
      webhookSecret: { type: String, default: '', select: false },
      isEnabled: { type: Boolean, default: false },
    },

    // ===== Thong bao shop hien tren trang chu =====
    announcement: {
      isActive: { type: Boolean, default: false },
      content: { type: String, default: '' },
      type: {
        type: String,
        enum: ['info', 'warning', 'success'],
        default: 'info',
      },
    },

    // ===== Thong bao POPUP hien 1 lan moi khi khach vao web (kem robot AI
    // vay tay + tu bat nhac khi khach dong thong bao) - khac voi thanh
    // "announcement" mong o tren dau trang, cai nay la 1 hop thoai lon,
    // chuyen nghiep hon, danh cho thong bao quan trong Admin muon khach
    // CHAC CHAN nhin thay (khuyen mai, bao tri, thong bao lon...). =====
    popupAnnouncement: {
      isActive: { type: Boolean, default: false },
      title: { type: String, default: '' },
      content: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      // Tang moi lan Admin bam "Luu" - dung de FE biet noi dung vua doi va
      // hien lai popup cho khach DU HO DA TUNG DONG truoc do trong phien
      // nay (xem PopupAnnouncement.jsx#SESSION_KEY).
      version: { type: Number, default: 0 },
    },

    // ===== Thong tin chung cua shop =====
    shopInfo: {
      shopName: { type: String, default: 'Khanghuynh.shop' },
      contactEmail: { type: String, default: 'huynhphuocgiakhang23@gmail.com' },
      zaloUrl: { type: String, default: '' },
    },

    // ===== Nhac nen website (link MP3, phat khi nguoi dung bam nut bat dau) =====
    musicConfig: {
      isEnabled: { type: Boolean, default: false },
      musicUrl: { type: String, default: '' },
      title: { type: String, default: '' },
      volume: { type: Number, default: 0.5, min: 0, max: 1 },
    },

    // ===== Han muc nap tien =====
    depositLimits: {
      minAmount: { type: Number, default: 10000 },
      maxAmount: { type: Number, default: 50000000 },
    },
  },
  { timestamps: true }
);

/**
 * Lay config duy nhat trong he thong, neu chua ton tai thi tu tao moi.
 */
systemConfigSchema.statics.getSingleton = async function getSingleton() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
