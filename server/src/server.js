require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { verifyMailer } = require('./config/mailer');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await verifyMailer();

  const server = app.listen(PORT, () => {
    console.log(`
========================================
  Khanghuynh.shop API Server
  Dang chay tai: http://localhost:${PORT}
  Moi truong: ${process.env.NODE_ENV || 'development'}
========================================
    `);
  });

  // Xu ly tat server an toan khi nhan signal terminate
  const shutdown = (signal) => {
    console.log(`\n[Server] Nhan duoc ${signal}, dang tat server...`);
    server.close(() => {
      console.log('[Server] Da tat server an toan.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('[UnhandledRejection]', err);
  });
};

startServer();
