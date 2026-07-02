require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Script tao tai khoan Admin dau tien cho he thong.
 * Chay bang: npm run seed:admin
 * Thong tin admin lay tu .env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME
 */
const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Da ket noi MongoDB.');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`[Seed] Da ton tai admin: ${existingAdmin.username} (${existingAdmin.email}). Bo qua.`);
      process.exit(0);
    }

    const admin = await User.create({
      username: process.env.ADMIN_USERNAME || 'superadmin',
      email: process.env.ADMIN_EMAIL || 'admin@khanghuynh.shop',
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      fullName: 'Quan Tri Vien',
      role: 'admin',
    });

    console.log('[Seed] Tao admin thanh cong!');
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email: ${admin.email}`);
    console.log('  => Hay dang nhap va DOI MAT KHAU ngay lap tuc.');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Loi:', error.message);
    process.exit(1);
  }
};

seedAdmin();
