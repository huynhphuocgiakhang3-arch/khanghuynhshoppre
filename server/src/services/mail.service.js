const { transporter } = require('../config/mailer');

/**
 * Gui email chung, dung lai cho moi loai thong bao.
 */
const sendEmail = async ({ to, subject, html }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Khanghuynh.shop';
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('[MailService] Gui email loi:', error.message);
    return false;
  }
};

/** Email chao mung khi user dang ky thanh cong */
const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Chao mung ban den voi Khanghuynh.shop!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#7c3aed;">Xin chao ${user.fullName || user.username},</h2>
        <p>Cam on ban da dang ky tai khoan tai <b>Khanghuynh.shop</b> - chuyen file game Free Fire uy tin.</p>
        <p>Ten dang nhap: <b>${user.username}</b></p>
        <p>Hay nap vi va kham pha cac san pham hap dan ngay hom nay!</p>
        <p style="margin-top:24px;color:#888;font-size:12px;">Day la email tu dong, vui long khong tra loi.</p>
      </div>
    `,
  });

/** Email thong bao don hang da duoc tao / thanh toan thanh cong */
const sendOrderConfirmationEmail = (user, order) =>
  sendEmail({
    to: user.email,
    subject: `Don hang ${order.orderCode} da duoc xac nhan`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#7c3aed;">Don hang cua ban da thanh toan thanh cong!</h2>
        <p>Ma don hang: <b>${order.orderCode}</b></p>
        <p>Tong tien: <b>${order.totalAmount.toLocaleString('vi-VN')} VND</b></p>
        <p>San pham se duoc giao trong tai khoan, vui long kiem tra muc "Don hang cua toi".</p>
        <p style="margin-top:24px;color:#888;font-size:12px;">Day la email tu dong, vui long khong tra loi.</p>
      </div>
    `,
  });

/** Email reset mat khau, chua link kem token */
const sendResetPasswordEmail = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: 'Yeu cau dat lai mat khau',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#7c3aed;">Dat lai mat khau</h2>
        <p>Ban (hoac ai do) vua yeu cau dat lai mat khau cho tai khoan nay.</p>
        <p>Nhan vao lien ket ben duoi de dat mat khau moi (het han trong 15 phut):</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;">Dat lai mat khau</a>
        <p style="margin-top:24px;color:#888;font-size:12px;">Neu khong phai ban yeu cau, hay bo qua email nay.</p>
      </div>
    `,
  });

/** Email thong bao nap tien thanh cong */
const sendDepositSuccessEmail = (user, amount) =>
  sendEmail({
    to: user.email,
    subject: 'Nap tien thanh cong',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#16a34a;">Nap tien thanh cong!</h2>
        <p>So tien: <b>${amount.toLocaleString('vi-VN')} VND</b> da duoc cong vao vi cua ban.</p>
        <p>So du hien tai: <b>${user.balance.toLocaleString('vi-VN')} VND</b></p>
      </div>
    `,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendResetPasswordEmail,
  sendDepositSuccessEmail,
};
