const crypto = require('crypto');

/**
 * Sinh ma noi dung chuyen khoan duy nhat de doi soat tu dong.
 * Vi du: KH7F3A9B2C -> de khach ghi vao noi dung CK, webhook se doc lai
 * noi dung nay tu sao ke ngan hang de khop don va cong tien tu dong.
 */
const generateTransferContent = (userId) => {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const shortUserId = String(userId).slice(-4).toUpperCase();
  return `KH${shortUserId}${random}`;
};

/**
 * Sinh ma giao dich theo dinh dang "KHANGHUYNH" + 6 so ngau nhien (vi du:
 * KHANGHUYNH482913), dung rieng cho luong thanh toan VietQR tu dong doi
 * soat qua SePay (xem controllers/checkPayment.controller.js). Dinh dang
 * nay van bat dau bang "KH" nen tuong thich voi extractTransferCode() da co
 * san (regex /KH[A-Z0-9]{8,16}/) - khong can sua logic doi soat cu.
 */
const generateSimpleTransferCode = () => {
  const sixDigits = Math.floor(100000 + Math.random() * 900000); // luon dung 6 chu so
  return `KHANGHUYNH${sixDigits}`;
};

module.exports = { generateTransferContent, generateSimpleTransferCode };
