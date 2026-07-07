const mongoose = require('mongoose');

/**
 * Ket noi toi MongoDB bang Mongoose.
 * Tu dong thoat process neu khong ket noi duoc sau khi khoi dong.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    console.log(`[MongoDB] Da ket noi: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Mat ket noi toi database.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Loi ket noi:', err.message);
    });
  } catch (error) {
    console.error('[MongoDB] Khong the ket noi:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
