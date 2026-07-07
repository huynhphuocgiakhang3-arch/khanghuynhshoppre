require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { verifyMailer } = require('./config/mailer');
const { startPeriodicIntegrityCheck } = require('./services/antiCrack.service');
const { startTelegramBotPolling } = require('./services/telegramBot.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await verifyMailer();

  // Anti-crack: quet dinh ky doi chieu so du DB voi so cai giao dich, phat
  // hien ngay neu co tai khoan bi chinh sua truc tiep trong MongoDB (xem
  // services/antiCrack.service.js)
  startPeriodicIntegrityCheck();

  // Bot Telegram: lang nghe lenh /users, /orders tu Admin de xem nhanh thong
  // ke ma khong can mo trang admin (xem services/telegramBot.service.js)
  startTelegramBotPolling();

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
