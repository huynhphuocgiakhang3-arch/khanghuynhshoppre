const SystemConfig = require('../models/SystemConfig');
const catchAsync = require('../utils/catchAsync');
const { sendEmail } = require('../services/mail.service');

/**
 * @route POST /api/contact
 * @desc Nhan form lien he tu trang Contact, gui email den admin shop.
 */
const submitContactForm = catchAsync(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  const config = await SystemConfig.getSingleton();
  const adminEmail = config.shopInfo.contactEmail || process.env.SMTP_USER;

  await sendEmail({
    to: adminEmail,
    subject: `[Lien he website] ${subject || 'Khong co chu de'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3>Co lien he moi tu website</h3>
        <p><b>Ho ten:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Noi dung:</b></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  });

  res.status(200).json({ success: true, message: 'Da gui lien he thanh cong, chung toi se phan hoi som nhat.' });
});

/**
 * @route GET /api/config/public
 * @desc Tra ve cac thong tin cau hinh KHONG nhay cam de hien thi tren frontend
 *       (ten shop, thong bao, lien he... khong gom apiKey/bank account day du neu can an)
 */
const getPublicConfig = catchAsync(async (req, res) => {
  const config = await SystemConfig.getSingleton();

  res.status(200).json({
    success: true,
    data: {
      shopInfo: config.shopInfo,
      announcement: config.announcement,
      depositLimits: config.depositLimits,
      musicConfig: config.musicConfig,
    },
  });
});

module.exports = { submitContactForm, getPublicConfig };
