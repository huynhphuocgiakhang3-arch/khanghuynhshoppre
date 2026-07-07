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
const sendTelegramMessage = async (text, replyMarkup = null) => {
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
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      },
      { timeout: 8000 }
    );
  } catch (error) {
    console.error('[telegram] Gui thong bao that bai:', error.response?.data || error.message);
  }
};

/** Escape ky tu dac biet HTML de tranh loi format tin nhan Telegram (parse_mode: HTML) */
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;
const now = () => new Date().toLocaleString('vi-VN');
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';

/**
 * Gui 1 ANH kem chu thich (caption) qua Telegram - dung khi thong bao co
 * dinh kem anh minh chung (the cao, bill chuyen khoan...). Anh duoc gui
 * bang URL truc tiep (Cloudinary) - Telegram se tu tai anh ve, khong can
 * upload lai file qua bot.
 *
 * Neu gui anh that bai (vd URL loi, Telegram khong tai duoc anh do link vua
 * upload chua kip lan truyen qua CDN...), se fallback gui tin nhan TEXT
 * thuong kem link anh, dam bao Admin van nhan duoc thong bao du anh loi.
 */
const sendTelegramPhoto = async (photoUrl, caption, replyMarkup = null) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] Bo qua gui anh: chua cau hinh TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong .env');
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      },
      { timeout: 12000 }
    );
  } catch (error) {
    console.error('[telegram] Gui anh that bai, fallback sang tin nhan text:', error.response?.data || error.message);
    await sendTelegramMessage(`${caption}\n\n🖼 (Không gửi kèm được ảnh, xem tại: ${photoUrl})`);
  }
};

/** Thong bao khi khach gui the cao moi, can Admin vao duyet */
const notifyNewCardTopup = (cardTopup, username) => {
  const adminUrl = process.env.TELEGRAM_ADMIN_URL || '';
  const caption =
    `🔔 <b>Thẻ cào mới cần duyệt</b>\n` +
    `👤 Khách: <b>${escapeHtml(username)}</b>\n` +
    `💳 Loại thẻ: ${escapeHtml(cardTopup.cardType)}\n` +
    `💰 Mệnh giá: ${cardTopup.amount.toLocaleString('vi-VN')}đ\n` +
    `🕒 ${new Date(cardTopup.createdAt).toLocaleString('vi-VN')}\n` +
    (adminUrl ? `\n👉 Xem &amp; duyệt tại: ${adminUrl}/card-topups` : '');

  // Giong het chuyen khoan QR: 2 nut bam duyet nhanh ngay duoi tin nhan,
  // khong can mo trang admin. Ap dung ca khi co anh lan khong co anh, vi
  // Admin van co the doi chieu bang serial/ma the hien trong tin nhan.
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Thành công (Cộng tiền)', callback_data: `card_ok:${cardTopup._id}` },
        { text: '❌ Thất bại (Thẻ sai/đã dùng)', callback_data: `card_no:${cardTopup._id}` },
      ],
    ],
  };

  if (cardTopup.cardImage) {
    return sendTelegramPhoto(cardTopup.cardImage, caption, replyMarkup);
  }
  return sendTelegramMessage(`${caption}\n🖼 Không có ảnh minh chứng`, replyMarkup);
};

/** Thong bao khi khach upload anh xac nhan chuyen khoan QR, can Admin doi soat */
const notifyNewDepositProof = (transaction, username) => {
  const adminUrl = process.env.TELEGRAM_ADMIN_URL || '';
  const caption =
    `🔔 <b>Có ảnh xác nhận chuyển khoản mới</b>\n` +
    `👤 Khách: <b>${escapeHtml(username)}</b>\n` +
    `💰 Số tiền: ${transaction.amount.toLocaleString('vi-VN')}đ\n` +
    `📝 Nội dung CK: ${escapeHtml(transaction.transferContent || '')}\n` +
    `🕒 ${new Date().toLocaleString('vi-VN')}\n` +
    (adminUrl ? `\n👉 Xem &amp; duyệt tại: ${adminUrl}/deposits` : '');

  // CHI rieng chuyen khoan ngan hang (QR) moi co 2 nut bam duyet nhanh ngay
  // duoi tin nhan Telegram - the cao KHONG co 2 nut nay (phai vao trang
  // admin doi chieu ma the/serial thu cong nhu binh thuong).
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Duyệt & Cộng tiền', callback_data: `dep_ok:${transaction._id}` },
        { text: '❌ Bill giả / Trục trặc', callback_data: `dep_no:${transaction._id}` },
      ],
    ],
  };

  if (transaction.proofImage) {
    return sendTelegramPhoto(transaction.proofImage, caption, replyMarkup);
  }
  return sendTelegramMessage(`${caption}\n🖼 Không có ảnh minh chứng`);
};

/**
 * 🛒 Thong bao co don hang / dat dich vu moi (mua bang vi). Style "coder /
 * dashboard console" - ro rang, chuyen nghiep, du thong tin de admin nam
 * tinh hinh ngay tren dien thoai ma khong can mo trang admin.
 */
const notifyNewPurchase = (order, user, { isVip = false, discountAmount = 0, isServiceOrder = false } = {}) => {
  const orderCode = order.orderCode || order._id?.toString().slice(-8).toUpperCase();
  const itemsList = isServiceOrder
    ? (order.features || []).map((f) => `   • ${escapeHtml(f.name)} — ${vnd(f.price)}`).join('\n')
    : (order.items || []).map((i) => `   • ${escapeHtml(i.name)}${i.variantName ? ` (${escapeHtml(i.variantName)})` : ''} x${i.quantity} — ${vnd(i.price)}`).join('\n');

  const text =
    `💸 <b>${isServiceOrder ? 'ĐƠN ĐẶT DỊCH VỤ MỚI' : 'ĐƠN HÀNG MỚI'}</b> ${isVip ? '👑' : ''}\n` +
    `${DIVIDER}\n` +
    `🆔 Mã đơn: <code>${escapeHtml(orderCode)}</code>\n` +
    `👤 Khách hàng: <b>${escapeHtml(user.username)}</b>${isVip ? ' <b>[VIP GUEST]</b>' : ''}\n` +
    `📦 Chi tiết:\n${itemsList}\n` +
    (discountAmount > 0 ? `🎁 Ưu đãi VIP: -${vnd(discountAmount)}\n` : '') +
    `💰 Tổng thanh toán: <b>${vnd(order.totalAmount ?? order.totalPrice)}</b>\n` +
    `💳 Số dư còn lại: ${vnd(user.balance)}\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}\n` +
    `✅ Trạng thái: <b>Đã thanh toán tự động qua ví</b>`;
  return sendTelegramMessage(text);
};

/**
 * ✅ Thong bao khi Admin DUYET mot yeu cau nap tien (the cao hoac QR co anh),
 * gui SAU khi da duyet xong - "chot so", ro rang ai duyet, cong bao nhieu.
 */
const notifyDepositApproved = (kind, { username, amount, balanceAfter, adminUsername, method, refNote = '' }) => {
  const methodLabel = { card: '💳 Thẻ cào', vietqr: '🏦 Chuyển khoản QR', bank_transfer: '🏦 Chuyển khoản' }[method] || method;
  const text =
    `✅ <b>ĐÃ DUYỆT NẠP TIỀN THÀNH CÔNG</b>\n` +
    `${DIVIDER}\n` +
    `👤 Khách hàng: <b>${escapeHtml(username)}</b>\n` +
    `${methodLabel}${refNote ? ` — ${escapeHtml(refNote)}` : ''}\n` +
    `💰 Số tiền cộng: <b>+${vnd(amount)}</b>\n` +
    `💳 Số dư sau khi cộng: ${vnd(balanceAfter)}\n` +
    `👮 Admin xử lý: <b>${escapeHtml(adminUsername)}</b>\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};

/** ❌ Thong bao khi Admin TU CHOI mot yeu cau nap tien */
const notifyDepositRejected = (kind, { username, amount, adminUsername, reason }) => {
  const text =
    `❌ <b>ĐÃ TỪ CHỐI YÊU CẦU NẠP TIỀN</b>\n` +
    `${DIVIDER}\n` +
    `👤 Khách hàng: <b>${escapeHtml(username)}</b>\n` +
    `💰 Số tiền yêu cầu: ${vnd(amount)}\n` +
    `📝 Lý do: ${escapeHtml(reason || 'Không hợp lệ')}\n` +
    `👮 Admin xử lý: <b>${escapeHtml(adminUsername)}</b>\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};

/**
 * ⚠️ ANTI-CRACK: Thong bao khi phat hien BIEN DONG SO DU BAT THUONG tren
 * mot tai khoan (tang/giam vuot nguong ma khong qua don hang/nap tien hop
 * le duoc he thong ghi nhan dung quy trinh). Day la tuyen phong thu cuoi:
 * du hacker co bang cach nao chinh thang balance trong DB (bypass API), bot
 * background quet dinh ky (xem antiCrack.service.js) van se phat hien va
 * bao ngay cho Admin.
 */
const notifyBalanceAnomaly = ({ username, userId, balanceBefore, balanceAfter, diff, reason, source }) => {
  const text =
    `🚨🚨🚨 <b>CẢNH BÁO ANTI-CRACK</b> 🚨🚨🚨\n` +
    `${DIVIDER}\n` +
    `⚠️ Phát hiện <b>biến động số dư bất thường</b>\n` +
    `👤 Tài khoản: <b>${escapeHtml(username)}</b> (<code>${escapeHtml(String(userId))}</code>)\n` +
    `📊 Trước: ${vnd(balanceBefore)} → Sau: ${vnd(balanceAfter)}\n` +
    `📈 Chênh lệch: <b>${diff >= 0 ? '+' : ''}${vnd(diff)}</b>\n` +
    `🔍 Nguồn phát hiện: ${escapeHtml(source || 'unknown')}\n` +
    `📝 ${escapeHtml(reason || '')}\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}\n` +
    `👉 Vui lòng kiểm tra ngay lịch sử giao dịch của tài khoản này.`;
  return sendTelegramMessage(text);
};

/** 🛡️ Thong bao moi lan Admin CONG/TRU so du thu cong cho 1 user */
const notifyBalanceAdjusted = ({ username, adminUsername, amount, balanceBefore, balanceAfter, note }) => {
  const isAdd = amount >= 0;
  const text =
    `${isAdd ? '➕' : '➖'} <b>ADMIN ĐÃ ${isAdd ? 'CỘNG' : 'TRỪ'} SỐ DƯ THỦ CÔNG</b>\n` +
    `${DIVIDER}\n` +
    `👤 Tài khoản: <b>${escapeHtml(username)}</b>\n` +
    `👮 Admin thực hiện: <b>${escapeHtml(adminUsername)}</b>\n` +
    `💰 Số tiền: <b>${isAdd ? '+' : ''}${vnd(amount)}</b>\n` +
    `📊 Trước: ${vnd(balanceBefore)} → Sau: ${vnd(balanceAfter)}\n` +
    `📝 Ghi chú: ${escapeHtml(note || 'Không có')}\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};

/** 🗑️ Thong bao khi Admin XOA mot tai khoan */
const notifyUserDeleted = ({ username, email, adminUsername, balanceAtDeletion }) => {
  const text =
    `🗑️ <b>ADMIN ĐÃ XÓA TÀI KHOẢN</b>\n` +
    `${DIVIDER}\n` +
    `👤 Tài khoản bị xóa: <b>${escapeHtml(username)}</b> (${escapeHtml(email)})\n` +
    `💰 Số dư tại thời điểm xóa: ${vnd(balanceAtDeletion)}\n` +
    `👮 Admin thực hiện: <b>${escapeHtml(adminUsername)}</b>\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}\n` +
    `⚠️ Hành động không thể hoàn tác.`;
  return sendTelegramMessage(text);
};

/** 👑 Thong bao khi Admin thay doi VAI TRO (nang len VIP / ha xuong / khoa) cua 1 user */
const notifyRoleChanged = ({ username, adminUsername, oldRole, newRole }) => {
  const text =
    `👑 <b>ADMIN ĐÃ THAY ĐỔI QUYỀN TÀI KHOẢN</b>\n` +
    `${DIVIDER}\n` +
    `👤 Tài khoản: <b>${escapeHtml(username)}</b>\n` +
    `🔄 ${escapeHtml(oldRole)} → <b>${escapeHtml(newRole)}</b>\n` +
    `👮 Admin thực hiện: <b>${escapeHtml(adminUsername)}</b>\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};

/**
 * 🆕 Thong bao khi co TAI KHOAN MOI dang ky - gui chi tiet thoi gian, thong
 * tin tai khoan (khong bao gio gui mat khau/token) de Admin theo doi luong
 * nguoi dung moi va phat hien som neu co dau hieu spam/bot dang ky hang loat.
 */
const notifyNewUserRegistered = ({ username, email, fullName, ip, userAgent }) => {
  const text =
    `🆕 <b>TÀI KHOẢN MỚI ĐĂNG KÝ</b>\n` +
    `${DIVIDER}\n` +
    `👤 Username: <b>${escapeHtml(username)}</b>\n` +
    `📧 Email: ${escapeHtml(email)}\n` +
    (fullName ? `🪪 Họ tên: ${escapeHtml(fullName)}\n` : '') +
    `🌐 IP đăng ký: <code>${escapeHtml(ip || 'N/A')}</code>\n` +
    (userAgent ? `📱 Thiết bị: ${escapeHtml(userAgent.slice(0, 120))}\n` : '') +
    `🕒 Thời gian: ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};
const notifySecurityAlert = ({ title, details, severity = 'high' }) => {
  const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
  const text =
    `${icon} <b>CẢNH BÁO BẢO MẬT: ${escapeHtml(title)}</b>\n` +
    `${DIVIDER}\n` +
    `${escapeHtml(details)}\n` +
    `🕒 ${now()}\n` +
    `${DIVIDER}`;
  return sendTelegramMessage(text);
};

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
  sendTelegramPhoto,
  notifyNewCardTopup,
  notifyNewDepositProof,
  notifyNewPurchase,
  notifyDepositApproved,
  notifyDepositRejected,
  notifyBalanceAnomaly,
  notifyBalanceAdjusted,
  notifyUserDeleted,
  notifyRoleChanged,
  notifyNewUserRegistered,
  notifySecurityAlert,
  sendTestMessage,
  getConfigStatus,
};
