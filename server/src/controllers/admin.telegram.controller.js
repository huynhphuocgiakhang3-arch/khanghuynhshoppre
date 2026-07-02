const catchAsync = require('../utils/catchAsync');
const { sendTestMessage, getConfigStatus } = require('../services/telegram.service');

/**
 * @route GET /api/admin/telegram/status
 * @desc Cho biet server dang chay CO NHIN THAY bien moi truong
 *       TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID hay khong (khong lo gia tri
 *       that). Dung de phan biet loi do chua restart server / chua khai bao
 *       tren host, voi loi do sai gia tri token/chat_id.
 */
const getTelegramStatus = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: getConfigStatus() });
});

/**
 * @route POST /api/admin/telegram/test
 * @desc Gui 1 tin nhan thu qua Telegram Bot, tra loi ro rang thanh cong hay
 *       that bai kem mo ta loi that tu Telegram (khong nuot loi) de Admin tu
 *       debug duoc ma khong can xem log server.
 */
const testTelegramConnection = catchAsync(async (req, res) => {
  try {
    await sendTestMessage();
    res.status(200).json({ success: true, message: 'Đã gửi tin nhắn thử thành công, kiểm tra Telegram của bạn!' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = { testTelegramConnection, getTelegramStatus };
