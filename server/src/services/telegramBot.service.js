const axios = require('axios');
const User = require('../models/User');
const Order = require('../models/Order');
const ServiceOrder = require('../models/ServiceOrder');
const { sendTelegramMessage } = require('./telegram.service');
const { approveDepositById, rejectDepositById } = require('./depositApproval.service');
const { approveCardTopupById, rejectCardTopupById } = require('./cardTopupApproval.service');

/**
 * ===========================================================================
 * TELEGRAM BOT - LENH TRUY VAN NHANH (long polling)
 * ===========================================================================
 * Dung "long polling" (goi lien tuc `getUpdates`) thay vi webhook: khong can
 * server co domain/HTTPS cong khai, khong can dang ky webhook voi Telegram,
 * chi can server dang chay lien tuc (giong cach da dung cho anti-crack
 * periodic check). Phu hop voi moi kieu deploy (VPS, Render, localhost...).
 *
 * BAO MAT: CHI phan hoi tin nhan den tu dung TELEGRAM_CHAT_ID da cau hinh
 * trong .env - moi tin nhan/lenh tu chat khac deu bi bo qua hoan toan, tranh
 * truong hop nguoi la nhan ra username bot va doc duoc so lieu noi bo.
 * ===========================================================================
 */

let pollingOffset = 0;
let isPollingActive = false;

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const TELEGRAM_MAX_LEN = 3800; // De du 4096 cua Telegram, chua het HTML tag
const LIST_LIMIT = 60; // Toi da bao nhieu dong chi tiet gui ra (tranh spam qua dai)

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const ORDER_STATUS_LABEL = { pending: '⏳ Chờ xử lý', paid: '✅ Đã thanh toán', delivered: '📦 Đã giao', cancelled: '🚫 Đã hủy', failed: '❌ Thất bại', completed: '✅ Hoàn thành' };

/**
 * Chia 1 doan text dai thanh nhieu phan <= TELEGRAM_MAX_LEN ky tu, cat theo
 * ranh gioi dong ("\n") de khong lam vo the <b>/<code> giua chung, roi gui
 * TUAN TU tung phan (Telegram gioi han 1 tin nhan toi da 4096 ky tu).
 */
const sendChunked = async (fullText) => {
  const lines = fullText.split('\n');
  let chunk = '';

  for (const line of lines) {
    if ((chunk + '\n' + line).length > TELEGRAM_MAX_LEN) {
      await sendTelegramMessage(chunk);
      chunk = line;
    } else {
      chunk = chunk ? `${chunk}\n${line}` : line;
    }
  }
  if (chunk) await sendTelegramMessage(chunk);
};

/**
 * Xu ly lenh /users: hien tong quan + LIET KE CHI TIET tung tai khoan (ten,
 * email, vai tro, so du, trang thai) - moi nguoi 1 dong, moi nhat len dau.
 */
const handleUsersCommand = async () => {
  const [total, vipCount, adminCount, bannedCount] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'vip' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'banned' }),
  ]);

  const users = await User.find({})
    .select('username email role balance status createdAt')
    .sort('-createdAt')
    .limit(LIST_LIMIT)
    .lean();

  const roleTag = (r) => (r === 'admin' ? '🛡 Admin' : r === 'vip' ? '👑 VIP Guest' : '👤 User');

  // Moi tai khoan trinh bay thanh 1 KHOI 2 dong (ten in dam rieng 1 dong,
  // dong duoi thut le chua email/vai tro/so du/trang thai) thay vi don don
  // dam thong tin tren 1 dong dai - de mat de quet & de doc tren dien thoai.
  const listLines = users.map((u, idx) => {
    const statusDot = u.status === 'banned' ? '🔴 Đã khóa' : '🟢 Hoạt động';
    return (
      `<b>${idx + 1}. ${escapeHtml(u.username)}</b>\n` +
      `    ✉️ ${escapeHtml(u.email)}\n` +
      `    ${roleTag(u.role)}   •   💰 ${vnd(u.balance)}   •   ${statusDot}`
    );
  });

  const header =
    `📊 <b>TỔNG QUAN NGƯỜI DÙNG</b>\n` +
    `${DIVIDER}\n` +
    `┌ 👥 Tổng số tài khoản: <b>${total}</b>\n` +
    `├ 👑 VIP Guest: <b>${vipCount}</b>\n` +
    `├ 🛡 Admin: <b>${adminCount}</b>\n` +
    `└ 🔴 Đang bị khóa: <b>${bannedCount}</b>\n` +
    `${DIVIDER}\n` +
    `📋 <b>${users.length} tài khoản mới nhất</b>\n\n` +
    listLines.join('\n\n') +
    (total > users.length ? `\n\n… và <b>${total - users.length}</b> tài khoản khác chưa hiển thị.` : '') +
    `\n${DIVIDER}`;

  return sendChunked(header);
};

/**
 * Xu ly lenh /orders: hien tong quan doanh thu + LIET KE CHI TIET tung don
 * (ma don/khach hang/so tien/trang thai/thoi gian), gop ca don mua hang shop
 * va don dat dich vu, sap xep theo thoi gian moi nhat truoc.
 */
const handleOrdersCommand = async () => {
  const [orderCount, serviceOrderCount, orderRevenueAgg, serviceRevenueAgg, orders, serviceOrders] = await Promise.all([
    Order.countDocuments({}),
    ServiceOrder.countDocuments({}),
    Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, sum: { $sum: '$totalAmount' } } }]),
    ServiceOrder.aggregate([{ $group: { _id: null, sum: { $sum: '$totalPrice' } } }]),
    Order.find({}).populate('user', 'username').select('orderCode totalAmount status createdAt user').sort('-createdAt').limit(LIST_LIMIT).lean(),
    ServiceOrder.find({}).populate('user', 'username').select('device totalPrice status createdAt user').sort('-createdAt').limit(LIST_LIMIT).lean(),
  ]);

  const orderRevenue = orderRevenueAgg[0]?.sum || 0;
  const serviceRevenue = serviceRevenueAgg[0]?.sum || 0;

  // Gop 2 loai don lai thanh 1 danh sach chung, gan nhan phan biet, sap xep
  // theo thoi gian tao moi nhat truoc, roi chi lay LIST_LIMIT dong dau.
  const merged = [
    ...orders.map((o) => ({
      type: '🛒 Mua hàng',
      code: o.orderCode,
      username: o.user?.username || 'N/A',
      amount: o.totalAmount,
      status: ORDER_STATUS_LABEL[o.status] || o.status,
      createdAt: o.createdAt,
    })),
    ...serviceOrders.map((o) => ({
      type: '🛠 Đặt dịch vụ',
      code: o._id.toString().slice(-8).toUpperCase(),
      username: o.user?.username || 'N/A',
      amount: o.totalPrice,
      status: ORDER_STATUS_LABEL[o.status] || o.status,
      createdAt: o.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, LIST_LIMIT);

  const listLines = merged.map(
    (o, idx) =>
      `${idx + 1}. [${o.type}] <code>${escapeHtml(o.code)}</code> — <b>${escapeHtml(o.username)}</b> — ${vnd(o.amount)} — ${o.status}`
  );

  const totalCount = orderCount + serviceOrderCount;
  const header =
    `🧾 <b>TỔNG QUAN ĐƠN HÀNG</b>\n` +
    `${DIVIDER}\n` +
    `🛒 Đơn mua hàng (shop): <b>${orderCount}</b> — doanh thu ${vnd(orderRevenue)}\n` +
    `🛠 Đơn đặt dịch vụ: <b>${serviceOrderCount}</b> — doanh thu ${vnd(serviceRevenue)}\n` +
    `📦 Tổng cộng: <b>${totalCount}</b> đơn — ${vnd(orderRevenue + serviceRevenue)}\n` +
    `${DIVIDER}\n` +
    `📋 <b>Danh sách ${merged.length} đơn mới nhất:</b>\n` +
    listLines.join('\n') +
    (totalCount > merged.length ? `\n… và ${totalCount - merged.length} đơn khác (gõ lại /orders để xem danh sách mới nhất).` : '') +
    `\n${DIVIDER}`;

  return sendChunked(header);
};

/**
 * Xu ly lenh /advisors: hien danh sach TAT CA tai khoan Co van kem so du hoa
 * hong hien tai + % hoa hong dang ap dung, sap xep so du cao truoc de de
 * theo doi ai dang can rut/thanh toan.
 */
const handleAdvisorsCommand = async () => {
  const advisors = await User.find({ role: 'advisor' })
    .select('username email advisorBalance advisorCommissionRate status')
    .sort('-advisorBalance')
    .lean();

  if (advisors.length === 0) {
    return sendTelegramMessage(`🎓 <b>CỐ VẤN</b>\n${DIVIDER}\nHiện chưa có tài khoản Cố vấn nào.`);
  }

  const totalBalance = advisors.reduce((sum, a) => sum + (a.advisorBalance || 0), 0);

  const listLines = advisors.map((a, idx) => {
    const statusDot = a.status === 'banned' ? '🔴 Đã khóa' : '🟢 Hoạt động';
    const rate = Math.round((a.advisorCommissionRate ?? 0.3) * 100);
    return (
      `<b>${idx + 1}. ${escapeHtml(a.username)}</b>\n` +
      `    ✉️ ${escapeHtml(a.email)}\n` +
      `    💰 Số dư hoa hồng: <b>${vnd(a.advisorBalance)}</b>   •   📊 ${rate}%   •   ${statusDot}`
    );
  });

  const header =
    `🎓 <b>SỐ DƯ HOA HỒNG CỐ VẤN</b>\n` +
    `${DIVIDER}\n` +
    `👥 Tổng số Cố vấn: <b>${advisors.length}</b>\n` +
    `💰 Tổng số dư hoa hồng chưa rút: <b>${vnd(totalBalance)}</b>\n` +
    `${DIVIDER}\n` +
    listLines.join('\n\n') +
    `\n${DIVIDER}`;

  return sendChunked(header);
};

const handleHelpCommand = () => {
  const text =
    `🤖 <b>DANH SÁCH LỆNH</b>\n` +
    `${DIVIDER}\n` +
    `/users — Xem tổng số &amp; danh sách chi tiết người dùng\n` +
    `/orders — Xem tổng số &amp; danh sách chi tiết đơn hàng\n` +
    `/advisors — Xem số dư hoa hồng từng Cố vấn\n` +
    `/help — Xem danh sách lệnh này\n` +
    `${DIVIDER}\n` +
    `💡 Mẹo: bấm vào nút "/" ngay cạnh khung nhập tin nhắn trong Telegram để xem menu các lệnh này, chỉ cần bấm chọn là dùng luôn, không cần gõ tay.`;
  return sendTelegramMessage(text);
};

/** Dinh tuyen 1 tin nhan den den dung handler theo lenh (khong phan biet hoa/thuong) */
const routeCommand = async (rawText) => {
  const command = String(rawText || '').trim().toLowerCase().split(/[\s@]/)[0]; // bo qua tham so/@botname sau lenh

  switch (command) {
    case '/users':
    case '/soluongnguoidung':
    case '/tongnguoidung':
      return handleUsersCommand();
    case '/orders':
    case '/donhang':
    case '/tongdonhang':
      return handleOrdersCommand();
    case '/advisors':
    case '/covan':
    case '/hoahong':
      return handleAdvisorsCommand();
    case '/help':
    case '/start':
      return handleHelpCommand();
    default:
      return null; // Khong phai lenh minh ho tro -> im lang, khong spam tra loi
  }
};

/**
 * Dang ky danh sach lenh voi Telegram (setMyCommands) de khi Admin bam vao
 * icon "/" canh khung chat, Telegram TU HIEN menu goi y cac lenh nay kem mo
 * ta - chi can bam chon la gui luon, khong can go tay ten lenh.
 */
const registerBotCommands = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/setMyCommands`, {
      commands: [
        { command: 'users', description: '📊 Xem tổng số & danh sách người dùng' },
        { command: 'orders', description: '🧾 Xem tổng số & danh sách đơn hàng' },
        { command: 'advisors', description: '🎓 Xem số dư hoa hồng Cố vấn' },
        { command: 'help', description: '🤖 Xem danh sách lệnh' },
      ],
    });
    console.log('[telegram-bot] Da dang ky menu lenh "/" voi Telegram.');
  } catch (err) {
    console.error('[telegram-bot] Loi dang ky menu lenh:', err.response?.data || err.message);
  }
};

/** Tra loi 1 callback_query (bat buoc goi de Telegram tat "vong xoay loading" tren nut bam) */
const answerCallbackQuery = async (callbackQueryId, text, showAlert = false) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    });
  } catch (err) {
    console.error('[telegram-bot] Loi answerCallbackQuery:', err.response?.data || err.message);
  }
};

/** Sua noi dung 1 tin nhan VAN BAN thuong (khong phai anh) - dung cho truong hop the cao khong co anh dinh kem */
const editMessageText = async (chatId, messageId, newText) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.error('[telegram-bot] Loi editMessageText:', err.response?.data || err.message);
  }
};

/** Sua lai caption cua 1 tin nhan ANH da gui truoc do (dung sau khi da bam nut duyet/tu choi) va GO het nut bam (reply_markup rong) */
const editMessageCaption = async (chatId, messageId, newCaption) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/editMessageCaption`, {
      chat_id: chatId,
      message_id: messageId,
      caption: newCaption,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    });
  } catch (err) {
    console.error('[telegram-bot] Loi editMessageCaption:', err.response?.data || err.message);
  }
};

/**
 * Xu ly khi Admin BAM 1 trong 2 nut "Duyệt & Cộng tiền" / "Bill giả & Trục
 * trặc" ngay duoi anh bill chuyen khoan (chi ap dung cho QR/bank transfer,
 * KHONG ap dung cho the cao - the cao van phai vao trang admin doi chieu
 * serial/ma the thu cong nhu binh thuong).
 *
 * Dung CHUNG logic voi trang admin (services/depositApproval.service.js) -
 * dam bao duyet qua bot hay qua web deu cho ra cung 1 ket qua, khong bao
 * gio lech nhau.
 */
const handleCallbackQuery = async (callbackQuery) => {
  const [action, entityId] = String(callbackQuery.data || '').split(':');
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const isPhotoMessage = Boolean(callbackQuery.message?.caption);
  const originalText = callbackQuery.message?.caption || callbackQuery.message?.text || '';

  // Chon dung ham sua tin nhan tuy theo tin nhan goc la ANH (co caption) hay
  // VAN BAN thuong (the cao khong dinh kem anh) - Telegram yeu cau goi API
  // khac nhau cho 2 loai nay (editMessageCaption vs editMessageText).
  const updateOriginalMessage = (appendText) => {
    const newText = `${originalText}\n\n${appendText}`;
    return isPhotoMessage ? editMessageCaption(chatId, messageId, newText) : editMessageText(chatId, messageId, newText);
  };

  try {
    if (action === 'dep_ok') {
      const { transaction, user } = await approveDepositById(entityId, 'Admin (duyệt qua Telegram)');
      await answerCallbackQuery(callbackQuery.id, '✅ Đã duyệt & cộng tiền thành công!');
      await updateOriginalMessage(
        `✅ <b>ĐÃ DUYỆT & CỘNG ${transaction.amount.toLocaleString('vi-VN')}đ</b>\nSố dư mới của ${user.username}: ${user.balance.toLocaleString('vi-VN')}đ`
      );
    } else if (action === 'dep_no') {
      const { transaction } = await rejectDepositById(entityId, 'Admin (từ chối qua Telegram)', 'Bill giả hoặc trục trặc kỹ thuật (từ chối qua Telegram).');
      await answerCallbackQuery(callbackQuery.id, '❌ Đã từ chối giao dịch.');
      await updateOriginalMessage(`❌ <b>ĐÃ TỪ CHỐI</b>\nLý do: ${transaction.note}`);
    } else if (action === 'card_ok') {
      const { cardTopup, user } = await approveCardTopupById(entityId, 'Admin (duyệt qua Telegram)');
      await answerCallbackQuery(callbackQuery.id, '✅ Đã duyệt thẻ & cộng tiền thành công!');
      await updateOriginalMessage(
        `✅ <b>ĐÃ DUYỆT & CỘNG ${cardTopup.amount.toLocaleString('vi-VN')}đ</b>\nSố dư mới của ${user.username}: ${user.balance.toLocaleString('vi-VN')}đ`
      );
    } else if (action === 'card_no') {
      const { cardTopup } = await rejectCardTopupById(entityId, 'Admin (từ chối qua Telegram)', 'Thẻ sai hoặc đã qua sử dụng (từ chối qua Telegram).');
      await answerCallbackQuery(callbackQuery.id, '❌ Đã từ chối thẻ cào.');
      await updateOriginalMessage(`❌ <b>ĐÃ TỪ CHỐI</b>\nLý do: ${cardTopup.adminNote}`);
    } else {
      await answerCallbackQuery(callbackQuery.id, '');
    }
  } catch (err) {
    // Loi thuong gap nhat: giao dich/the da duoc xu ly truoc do (vd Admin da
    // bam duyet tren web trong luc dang xem Telegram) - bao ro cho Admin
    // biet bang show_alert thay vi chi bao mo hoac im lang.
    await answerCallbackQuery(callbackQuery.id, `⚠️ ${err.message || 'Có lỗi xảy ra.'}`, true);
  }
};

/** Goi 1 vong getUpdates (long polling, cho toi da 25s neu chua co tin nhan moi) */
const pollOnce = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatId = String(process.env.TELEGRAM_CHAT_ID || '');
  if (!token || !allowedChatId) return;

  const { data } = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
    params: { offset: pollingOffset, timeout: 25 },
    timeout: 30000,
  });

  for (const update of data.result || []) {
    pollingOffset = update.update_id + 1;

    // ----- Xu ly bam NUT BAM (inline keyboard) -----
    if (update.callback_query) {
      const cq = update.callback_query;
      // CHI xu ly callback tu dung chat admin da cau hinh, tuong tu tin nhan
      // thuong - chan tuyet doi bat ky ai khac bam nham/co tinh bam nut nay.
      if (String(cq.message?.chat?.id) === allowedChatId) {
        handleCallbackQuery(cq).catch((err) => console.error('[telegram-bot] Loi xu ly callback:', err.message));
      } else {
        answerCallbackQuery(cq.id, '⛔ Bạn không có quyền thực hiện thao tác này.', true).catch(() => {});
      }
      continue;
    }

    // ----- Xu ly LENH van ban (/users, /orders...) -----
    const message = update.message;
    if (!message || !message.text) continue;

    // CHI xu ly tin nhan tu dung chat admin da cau hinh - moi nguon khac deu
    // bi bo qua hoan toan (khong log lai noi dung, khong phan hoi).
    if (String(message.chat?.id) !== allowedChatId) continue;

    routeCommand(message.text).catch((err) => console.error('[telegram-bot] Loi xu ly lenh:', err.message));
  }
};

/**
 * Khoi dong vong lap long-polling chay nen. Tu dong lui lai 5s neu co loi
 * (mat mang, Telegram API tam thoi loi...) de tranh spam request lien tuc.
 */
const startTelegramBotPolling = () => {
  if (isPollingActive) return; // Tranh khoi dong trung neu goi nham 2 lan
  isPollingActive = true;

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('[telegram-bot] Bo qua khoi dong lenh bot: chua cau hinh TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.');
    return;
  }

  registerBotCommands();

  const loop = async () => {
    try {
      await pollOnce();
      setImmediate(loop);
    } catch (err) {
      console.error('[telegram-bot] Loi polling, thu lai sau 5s:', err.message);
      setTimeout(loop, 5000);
    }
  };

  loop();
  console.log('[telegram-bot] Da khoi dong lang nghe lenh Telegram (/users, /orders, /advisors, /help).');
};

module.exports = { startTelegramBotPolling };
