const User = require('../models/User');
const { notifySecurityAlert } = require('./telegram.service');

/**
 * Cong hoa hong cho TAT CA tai khoan dang co role='advisor' (Co van), moi
 * khi co 1 giao dich NAP TIEN thanh cong tren toan he thong (the cao, QR,
 * chuyen khoan tu dong deu goi ham nay). Moi Co van co the co % hoa hong
 * RIENG (advisorCommissionRate, Admin chinh duoc trong trang quan ly user),
 * mac dinh 30% - neu co nhieu Co van cung luc, MOI nguoi duoc cong doc lap
 * theo % cua chinh ho (khong chia deu).
 *
 * Day la 1 "so du hoa hong" RIENG BIET (advisorBalance), khong lien quan gi
 * den vi mua hang (balance) cua chinh tai khoan Co van do.
 */
const creditAdvisorsOnDeposit = async (depositAmount, sourceLabel) => {
  const advisors = await User.find({ role: 'advisor' });
  if (advisors.length === 0) return;

  const creditedList = [];

  for (const advisor of advisors) {
    const rate = advisor.advisorCommissionRate ?? 0.3;
    const commission = Math.round(Number(depositAmount) * rate);
    if (commission <= 0) continue;

    advisor.advisorBalance += commission;
    await advisor.save();
    creditedList.push(`${advisor.username} (+${commission.toLocaleString('vi-VN')}đ, ${Math.round(rate * 100)}%)`);
  }

  if (creditedList.length > 0) {
    notifySecurityAlert({
      title: 'Cộng hoa hồng Cố vấn',
      details: `Giao dịch nạp ${Number(depositAmount).toLocaleString('vi-VN')}đ (${sourceLabel}) → ${creditedList.join(', ')}`,
      severity: 'low',
    }).catch(() => {});
  }
};

module.exports = { creditAdvisorsOnDeposit };
