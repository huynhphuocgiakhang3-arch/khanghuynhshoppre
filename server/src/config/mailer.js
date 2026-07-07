const nodemailer = require('nodemailer');

/**
 * Tao transporter Nodemailer dung chung cho toan he thong.
 * Cau hinh SMTP duoc lay tu bien moi truong.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Kiem tra cau hinh SMTP khi server khoi dong (khong lam crash app neu loi).
 */
const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log('[Mailer] Cau hinh SMTP hop le, san sang gui email.');
  } catch (error) {
    console.warn('[Mailer] Khong the xac thuc SMTP:', error.message);
    console.warn('[Mailer] Email se khong gui duoc cho den khi sua lai .env');
  }
};

module.exports = { transporter, verifyMailer };
