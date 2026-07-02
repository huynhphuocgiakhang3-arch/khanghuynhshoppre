const axios = require('axios');

/**
 * Gui thong bao cho Admin qua Telegram Bot khi co su kien can duyet thu cong
 * (nap the cao moi, nap QR co anh xac nhan moi...). Thiet ke "fail-safe":
 * neu chua cau hinh TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID, hoac Telegram API
 * loi/timeout, ham se CHI log canh bao chu KHONG duoc lam fail request
 * chinh (nguoi dung van gui the/nap tien thanh cong binh thuong).
 *
 * Luu y bao mat: TELEGRAM_BOT_TOKEN phai duoc dat trong file .env that su
 * (da nam trong .gitignore), TUYET DOI khong hardcode token vao code hay
 * commit len GitHub - ai co token la co the dieu khien bot cua ban.
 */
const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] Bo qua gui thong bao: chua cau hinh TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong .env');
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
      { timeout: 8000 }
    );
  } catch (error) {
    console.error('[telegram] Gui thong bao that bai:', error.response?.data || error.message);
  }
};

/** Thong bao khi khach gui the cao moi, can Admin vao duyet */
const notifyNewCardTopup = (cardTopup, username) => {
  const adminUrl = process.env.TELEGRAM_ADMIN_URL || '';
  const text =
    `🔔 <b>Thẻ cào mới cần duyệt</b>\n` +
    `👤 Khách: <b>${escapeHtml(username)}</b>\n` +
    `💳 Loại thẻ: ${escapeHtml(cardTopup.cardType)}\n` +
    `💰 Mệnh giá: ${cardTopup.amount.toLocaleString('vi-VN')}đ\n` +
    `🕒 ${new Date(cardTopup.createdAt).toLocaleString('vi-VN')}\n` +
    (adminUrl ? `\n👉 Xem &amp; duyệt tại: ${adminUrl}/card-topups` : '');
  return sendTelegramMessage(text);
};

/** Thong bao khi khach upload anh xac nhan chuyen khoan QR, can Admin doi soat */
const notifyNewDepositProof = (transaction, username) => {
  const adminUrl = process.env.TELEGRAM_ADMIN_URL || '';
  const text =
    `🔔 <b>Có ảnh xác nhận chuyển khoản mới</b>\n` +
    `👤 Khách: <b>${escapeHtml(username)}</b>\n` +
    `💰 Số tiền: ${transaction.amount.toLocaleString('vi-VN')}đ\n` +
    `📝 Nội dung CK: ${escapeHtml(transaction.transferContent || '')}\n` +
    `🕒 ${new Date().toLocaleString('vi-VN')}\n` +
    (adminUrl ? `\n👉 Xem &amp; duyệt tại: ${adminUrl}/deposits` : '');
  return sendTelegramMessage(text);
};

/** Escape ky tu dac biet HTML de tranh loi format tin nhan Telegram (parse_mode: HTML) */
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Ban rieng cho nut "Gui tin nhan thu" trong trang Admin: KHONG nuot loi
 * nhu sendTelegramMessage (dung cho cac thong bao ngam), ma nem loi ra ro
 * rang de admin doc duoc chinh xac Telegram tra ve gi (vd "chat not found"
 * nghia la ban chua nhan /start cho bot, hoac sai chat_id).
 */
const sendTestMessage = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) throw new Error('Chưa cấu hình TELEGRAM_BOT_TOKEN trong .env (hoặc biến môi trường trên server đang chạy).');
  if (!chatId) throw new Error('Chưa cấu hình TELEGRAM_CHAT_ID trong .env (hoặc biến môi trường trên server đang chạy).');

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: chatId, text: '✅ Test thành công! Bot Telegram đã kết nối đúng với Khanghuynh.shop.' },
      { timeout: 8000 }
    );
  } catch (error) {
    // Tra nguyen van mo ta loi tu Telegram API de de debug (vd "Forbidden: bot
    // can't initiate conversation with a user" = ban CHUA nhan /start cho bot;
    // "chat not found" = sai chat_id; 401 = sai token)
    const desc = error.response?.data?.description || error.message;
    throw new Error(desc);
  }
};

/**
 * Kiem tra nhanh server hien tai co "nhin thay" TELEGRAM_BOT_TOKEN /
 * TELEGRAM_CHAT_ID hay khong - KHONG tra ve gia tri that cua token (chi vai
 * ky tu cuoi de doi chieu), dung de Admin tu debug xem loi la do .env chua
 * duoc doc (vd chua restart server) hay do gia tri sai/thieu chat_id.
 */
const getConfigStatus = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';
  return {
    tokenConfigured: Boolean(token),
    tokenPreview: token ? `...${token.slice(-6)}` : null,
    chatIdConfigured: Boolean(chatId),
    chatId: chatId || null,
  };
};

module.exports = {
  sendTelegramMessage,
  notifyNewCardTopup,
  notifyNewDepositProof,
  sendTestMessage,
  getConfigStatus,
};
