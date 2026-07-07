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

module.exports = { generateTransferContent };
