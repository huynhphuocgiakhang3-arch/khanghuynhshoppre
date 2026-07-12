const SystemConfig = require('../models/SystemConfig');
const catchAsync = require('../utils/catchAsync');
const { sendTelegramMessage } = require('../services/telegram.service');

/**
 * @route GET /api/admin/config
 * @desc Lay cau hinh he thong hien tai (an cac field nhay cam nhu apiKey)
 */
const getConfig = catchAsync(async (req, res) => {
  const config = await SystemConfig.getSingleton();
  res.status(200).json({ success: true, data: config });
});

/**
 * @route PUT /api/admin/config/bank
 * @desc Cap nhat thong tin ngan hang nhan tien (dung de tao QR MB Bank)
 */
const updateBankConfig = catchAsync(async (req, res) => {
  const { bin, bankName, accountNo, accountName, template, depositNote, customQrImage, customQrImagePublicId } =
    req.body;

  const config = await SystemConfig.getSingleton();
  if (bin !== undefined) config.bank.bin = bin;
  if (bankName !== undefined) config.bank.bankName = bankName;
  if (accountNo !== undefined) config.bank.accountNo = accountNo;
  if (accountName !== undefined) config.bank.accountName = accountName;
  if (template !== undefined) config.bank.template = template;
  if (depositNote !== undefined) config.bank.depositNote = depositNote;
  if (customQrImage !== undefined) config.bank.customQrImage = customQrImage;
  if (customQrImagePublicId !== undefined) config.bank.customQrImagePublicId = customQrImagePublicId;

  await config.save();

  // Bat buoc thong bao Telegram MOI khi thay doi thong tin ngan hang/QR
  // nhan tien - day la thong tin cuc ky nhay cam (doi sai/bi doi trai phep
  // se khien tien khach chuyen vao SAI tai khoan), can biet ngay du la
  // chinh Admin tu doi hay co dau hieu bat thuong.
  sendTelegramMessage(
    `🏦 <b>ĐÃ THAY ĐỔI THÔNG TIN NGÂN HÀNG/QR NHẬN TIỀN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛 Ngân hàng: ${config.bank.bankName || 'N/A'}\n` +
      `💳 Số tài khoản: <code>${config.bank.accountNo || 'N/A'}</code>\n` +
      `👤 Chủ tài khoản: ${config.bank.accountName || 'N/A'}\n` +
      `👮 Admin thực hiện: <b>${req.user?.username || 'N/A'}</b>\n` +
      `🕒 ${new Date().toLocaleString('vi-VN')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ Nếu bạn KHÔNG phải người thực hiện thay đổi này, hãy kiểm tra bảo mật tài khoản admin ngay lập tức.`
  ).catch(() => {});

  res.status(200).json({ success: true, data: config.bank });
});

/**
 * @route PUT /api/admin/config/payment-gateway
 * @desc Cap nhat cau hinh cong thanh toan tu dong (SePay/Casso/PayOS).
 *       Day la noi Admin dien API Key SAU KHI da dang ky voi nha cung cap
 *       HOP PHAP, khong lien quan gach the.
 */
const updatePaymentGatewayConfig = catchAsync(async (req, res) => {
  const { provider, apiKey, apiSecret, webhookSecret, isEnabled } = req.body;

  const config = await SystemConfig.getSingleton();
  config.paymentGateway = {
    provider: provider ?? config.paymentGateway.provider,
    apiKey: apiKey !== undefined ? apiKey : config.paymentGateway.apiKey,
    apiSecret: apiSecret !== undefined ? apiSecret : config.paymentGateway.apiSecret,
    webhookSecret: webhookSecret !== undefined ? webhookSecret : config.paymentGateway.webhookSecret,
    isEnabled: isEnabled ?? config.paymentGateway.isEnabled,
  };
  await config.save();

  res.status(200).json({
    success: true,
    message: 'Da cap nhat cau hinh cong thanh toan.',
    data: {
      provider: config.paymentGateway.provider,
      isEnabled: config.paymentGateway.isEnabled,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/payment/webhook`,
    },
  });
});

/**
 * @route PUT /api/admin/config/announcement
 */
const updateAnnouncement = catchAsync(async (req, res) => {
  const { isActive, content, type } = req.body;

  const config = await SystemConfig.getSingleton();
  if (isActive !== undefined) config.announcement.isActive = isActive;
  if (content !== undefined) config.announcement.content = content;
  if (type !== undefined) config.announcement.type = type;

  await config.save();
  res.status(200).json({ success: true, data: config.announcement });
});

/**
 * @route PUT /api/admin/config/shop-info
 */
const updateShopInfo = catchAsync(async (req, res) => {
  const { shopName, contactEmail, zaloUrl } = req.body;

  const config = await SystemConfig.getSingleton();
  if (shopName !== undefined) config.shopInfo.shopName = shopName;
  if (contactEmail !== undefined) config.shopInfo.contactEmail = contactEmail;
  if (zaloUrl !== undefined) config.shopInfo.zaloUrl = zaloUrl;

  await config.save();
  res.status(200).json({ success: true, data: config.shopInfo });
});

/**
 * @route PUT /api/admin/config/deposit-limits
 */
const updateDepositLimits = catchAsync(async (req, res) => {
  const { minAmount, maxAmount } = req.body;

  const config = await SystemConfig.getSingleton();
  if (minAmount !== undefined) config.depositLimits.minAmount = minAmount;
  if (maxAmount !== undefined) config.depositLimits.maxAmount = maxAmount;

  await config.save();
  res.status(200).json({ success: true, data: config.depositLimits });
});

/**
 * @route PUT /api/admin/config/music
 * @desc Cap nhat cau hinh nhac nen (link MP3), Admin dan link bai hat vao day.
 */
const updateMusicConfig = catchAsync(async (req, res) => {
  const { isEnabled, musicUrl, title, volume } = req.body;

  const config = await SystemConfig.getSingleton();
  if (isEnabled !== undefined) config.musicConfig.isEnabled = isEnabled;
  if (musicUrl !== undefined) config.musicConfig.musicUrl = musicUrl;
  if (title !== undefined) config.musicConfig.title = title;
  if (volume !== undefined) config.musicConfig.volume = volume;

  await config.save();
  res.status(200).json({ success: true, data: config.musicConfig });
});

/**
 * @route PUT /api/admin/config/popup-announcement
 * @desc Cap nhat thong bao popup (hien 1 lan moi khi khach vao web, kem
 *       robot AI vay tay + tu bat nhac khi dong). Moi lan luu se tang
 *       `version` len 1 - dam bao khach DA TUNG dong popup truoc do van se
 *       thay popup MOI xuat hien lai (vi noi dung da thay doi).
 */
const updatePopupAnnouncement = catchAsync(async (req, res) => {
  const { isActive, title, content, imageUrl } = req.body;

  const config = await SystemConfig.getSingleton();
  if (isActive !== undefined) config.popupAnnouncement.isActive = isActive;
  if (title !== undefined) config.popupAnnouncement.title = title;
  if (content !== undefined) config.popupAnnouncement.content = content;
  if (imageUrl !== undefined) config.popupAnnouncement.imageUrl = imageUrl;
  config.popupAnnouncement.version = (config.popupAnnouncement.version || 0) + 1;

  await config.save();
  res.status(200).json({ success: true, data: config.popupAnnouncement });
});

module.exports = {
  getConfig,
  updateBankConfig,
  updatePaymentGatewayConfig,
  updateAnnouncement,
  updatePopupAnnouncement,
  updateShopInfo,
  updateDepositLimits,
  updateMusicConfig,
};
