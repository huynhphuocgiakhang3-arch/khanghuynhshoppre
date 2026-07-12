const crypto = require('crypto');

/**
 * ===========================================================================
 * TOTP (Time-based One-Time Password) - TU VIET, KHONG CAN CAI THEM GOI NGOAI
 * ===========================================================================
 * Chuan RFC 6238 - CHINH LA thuat toan ma Google Authenticator / Authy /
 * Microsoft Authenticator dung. Dung cho tinh nang "Admin reset mat khau
 * phai nhap dung ma secret khong ai doan duoc" - ma nay:
 * - Doi moi 30 giay 1 lan (khong phai ma tinh, ke ca bi lo 1 lan cung het
 *   han rat nhanh).
 * - Chi Admin tao ra duoc, bang cach quet QR/nhap secret vao 1 app
 *   authenticator tren dien thoai (Google Authenticator, Authy...) - hoan
 *   toan khong can may chu nao khac, hoat dong offline tren dien thoai.
 * - Secret goc (ADMIN_RESET_TOTP_SECRET trong .env) khong bao gio roi khoi
 *   server + dien thoai Admin, khong truyen qua mang khi xac thuc.
 * ===========================================================================
 */

/** Giai ma 1 chuoi Base32 (RFC 4648) thanh Buffer - dinh dang chuan cua secret TOTP */
const base32Decode = (base32Str) => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32Str.toUpperCase().replace(/[^A-Z2-7]/g, '');

  let bits = '';
  for (const char of cleaned) {
    const val = ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
};

/** Sinh 1 secret Base32 ngau nhien moi (dung 1 lan khi thiet lap ban dau) */
const generateBase32Secret = (byteLength = 20) => {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(byteLength);
  let bits = '';
  for (const byte of randomBytes) bits += byte.toString(2).padStart(8, '0');

  let secret = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return secret;
};

/** Tinh ma TOTP 6 chu so tai 1 thoi diem (counter = so buoc 30s ke tu epoch) */
const generateTotpCode = (base32Secret, timeStepSeconds = 30, digits = 6, forTimestamp = Date.now()) => {
  const key = base32Decode(base32Secret);
  const counter = Math.floor(forTimestamp / 1000 / timeStepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);

  return String(binaryCode % 10 ** digits).padStart(digits, '0');
};

/**
 * Xac thuc 1 ma TOTP nguoi dung nhap vao, cho phep lech ±1 buoc (30s) de bu
 * do lech dong ho giua dien thoai va server - day la khuyen nghi chuan cua
 * RFC 6238, khong lam giam bao mat dang ke (van chi ~90s hieu luc).
 */
const verifyTotpCode = (base32Secret, inputCode, timeStepSeconds = 30, digits = 6) => {
  if (!base32Secret || !inputCode) return false;

  const now = Date.now();
  for (const stepOffset of [0, -1, 1]) {
    const code = generateTotpCode(base32Secret, timeStepSeconds, digits, now + stepOffset * timeStepSeconds * 1000);
    if (code === String(inputCode).trim()) return true;
  }
  return false;
};

module.exports = { generateBase32Secret, generateTotpCode, verifyTotpCode };
