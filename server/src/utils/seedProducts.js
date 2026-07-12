require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Script tao mot vai san pham mau de demo he thong ngay sau khi cai dat.
 * Chay bang: node src/utils/seedProducts.js
 */
const SAMPLE_PRODUCTS = [
  {
    name: 'Tài khoản Free Fire VIP - Full Skin Huyền Thoại',
    slug: 'acc-ff-vip-full-skin-huyen-thoai',
    description:
      'Tài khoản Free Fire cấp cao, sở hữu nhiều skin huyền thoại, vũ khí độc quyền, rank Heroic. Bàn giao đầy đủ thông tin đăng nhập ngay sau khi mua.',
    shortDescription: 'Full skin huyền thoại, rank Heroic, bàn giao ngay.',
    category: 'account',
    price: 850000,
    salePrice: 699000,
    thumbnail: '',
    stock: 5,
    isActive: true,
    isFeatured: true,
    tags: ['vip', 'full-skin', 'heroic'],
  },
  {
    name: '500 Kim Cương Free Fire',
    slug: '500-kim-cuong-free-fire',
    description: 'Nạp 500 kim cương trực tiếp vào tài khoản Free Fire của bạn trong vòng vài phút sau khi thanh toán.',
    shortDescription: 'Nạp nhanh, an toàn, đúng giờ.',
    category: 'diamond',
    price: 120000,
    salePrice: null,
    thumbnail: '',
    stock: 999,
    isActive: true,
    isFeatured: true,
    tags: ['diamond', 'topup'],
  },
  {
    name: 'Bộ Skin Súng AK Dragon',
    slug: 'bo-skin-sung-ak-dragon',
    description: 'Skin súng AK phiên bản Dragon, hiệu ứng bắn đặc biệt, độ hiếm cao.',
    shortDescription: 'Hiệu ứng bắn rồng lửa, độ hiếm Legendary.',
    category: 'skin',
    price: 250000,
    salePrice: 199000,
    thumbnail: '',
    stock: 20,
    isActive: true,
    isFeatured: true,
    tags: ['skin', 'weapon'],
  },
  {
    name: 'Vé Quay Premium Bundle',
    slug: 've-quay-premium-bundle',
    description: 'Gói 10 vé quay Premium, cơ hội nhận skin và vật phẩm hiếm.',
    shortDescription: 'Gói 10 vé quay, cơ hội trúng item hiếm.',
    category: 'item',
    price: 180000,
    salePrice: null,
    thumbnail: '',
    stock: 50,
    isActive: true,
    isFeatured: false,
    tags: ['item', 'lucky-spin'],
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Đã kết nối MongoDB.');

    for (const productData of SAMPLE_PRODUCTS) {
      const exists = await Product.findOne({ slug: productData.slug });
      if (exists) {
        console.log(`[Seed] Bỏ qua (đã tồn tại): ${productData.name}`);
        continue;
      }
      await Product.create(productData);
      console.log(`[Seed] Đã tạo: ${productData.name}`);
    }

    console.log('[Seed] Hoàn tất seed sản phẩm mẫu.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Lỗi:', error.message);
    process.exit(1);
  }
};

seedProducts();
