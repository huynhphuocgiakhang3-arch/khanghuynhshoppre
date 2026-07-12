const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui long nhap ten san pham'],
      trim: true,
      maxlength: 150,
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
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      default: '',
      maxlength: 300,
    },
    category: {
      // Truoc day gioi han bang enum cung (account/item/skin/...), gio cho phep
      // Admin tu tao category moi voi ten tuy chinh, luu duoi dang slug (vd: 'proxy', 'config-game').
      // Danh sach category hien co duoc quan ly o model Category rieng.
      type: String,
      required: [true, 'Vui long chon loai san pham'],
      trim: true,
      lowercase: true,
      default: 'khac',
    },
    price: {
      type: Number,
      required: [true, 'Vui long nhap gia'],
      min: [0, 'Gia khong the am'],
    },
    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    thumbnailPublicId: {
      // public_id tren Cloudinary, dung de xoa anh khi can (sua/xoa san pham)
      type: String,
      default: '',
    },
    // Video test/demo san pham (vd: video quay man hinh dang hoat dong,
    // preview truoc khi mua). Hien o the san pham (nut Play) va o trang chi
    // tiet (khu vuc xem truoc). testVideoThumbnail la anh poster hien thi
    // khi video chua duoc bam play (Cloudinary co the tu sinh tu video, nhung
    // cho phep fallback ve thumbnail san pham neu khong co).
    testVideoUrl: {
      type: String,
      default: '',
    },
    testVideoPublicId: {
      type: String,
      default: '',
    },
    testVideoThumbnail: {
      type: String,
      default: '',
    },
    images: [{ type: String }],
    // Cac file giao cho khach sau khi mua (upload qua Cloudinary).
    // Moi file gom: ten hien thi, url tren Cloudinary, vai public_id de co the xoa sau.
    deliveryFiles: [
      {
        name: { type: String, default: '' },
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    // Ghi chu hien thi cho khach SAU KHI mua thanh cong (huong dan su dung,
    // luu y bao hanh, cach kich hoat...) - hien cung luc voi cac file giao
    // hang o trang "Đơn hàng của tôi", KHONG hien cong khai truoc khi mua.
    purchaseNote: {
      type: String,
      default: '',
      maxlength: 3000,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Ghim san pham len dau danh sach (trang chu + trang san pham), khong
    // phu thuoc vao isFeatured. Cac san pham duoc ghim luon hien truoc, sap
    // xep theo pinnedAt (ghim gan nhat len truoc).
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    tags: [{ type: String, trim: true }],
    // Danh sach tinh nang/diem noi bat hien thi dang checklist co dau check (✓)
    // o trang chi tiet san pham, vi du: "Khong can root", "Cap nhat lien tuc"...
    features: [{ type: String, trim: true, maxlength: 150 }],
    // Cac goi/lua chon gia khac nhau cho cung 1 san pham (vi du: "1 thang",
    // "3 thang", "Vinh vien"...). Neu mang nay rong, san pham dung gia/kho/
    // file giao hang o cap goc (price/stock/deliveryFiles ben tren) nhu binh
    // thuong. Neu co variants, gia hien thi se la khoang "Tu X - Y" lay tu
    // day, va khach phai chon 1 variant cu the truoc khi mua.
    variants: [
      {
        name: { type: String, required: true, trim: true, maxlength: 100 }, // vd: "1 thang"
        price: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, default: null, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        deliveryFiles: [
          {
            name: { type: String, default: '' },
            url: { type: String, required: true },
            publicId: { type: String, default: '' },
          },
        ],
        // Ghi chu rieng cho goi nay (neu bo trong, se dung purchaseNote
        // chung cua san pham - xem logic gop o order.controller.js).
        purchaseNote: { type: String, default: '', maxlength: 3000 },
      },
    ],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });

/**
 * Tinh khoang gia hien thi: neu co variants, lay min/max tu cac variant
 * (uu tien salePrice neu co); neu khong co variants, dung gia goc cua san pham.
 * Dung chung cho ProductCard va trang chi tiet, tranh lap logic nhieu noi.
 */
productSchema.methods.getPriceRange = function getPriceRange() {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map((v) => v.salePrice ?? v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  const price = this.salePrice ?? this.price;
  return { min: price, max: price };
};

/** Tong kho: cong don kho cua tat ca variants, hoac kho goc neu khong co variant */
productSchema.methods.getTotalStock = function getTotalStock() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return this.stock;
};

module.exports = mongoose.model('Product', productSchema);
