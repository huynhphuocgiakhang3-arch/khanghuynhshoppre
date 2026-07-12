const AppError = require('../utils/AppError');

/**
 * ===========================================================================
 * IP WHITELIST - "CHI CO TOI VAO DUOC TRANG ADMIN"
 * ===========================================================================
 * Chan TOAN BO route /api/admin/* neu IP nguoi goi KHONG nam trong danh
 * sach ADMIN_ALLOWED_IPS (.env, cach nhau boi dau phay). Day la lop phong
 * thu SAU CUNG: du ai do co duoc username+password+PIN admin (bi lo, bi
 * doan, bi phishing...), neu ho khong dang o dung IP duoc cho phep thi VAN
 * KHONG VAO DUOC trang admin.
 *
 * THANH THAT VE GIOI HAN:
 * - Neu ADMIN_ALLOWED_IPS chua duoc cau hinh (rong), middleware nay se
 *   KHONG chan gi ca (mac dinh mo) - tranh truong hop admin tu khoa minh ra
 *   khoi he thong ngay lan deploy dau vi quen dien IP.
 * - Nha mang tai Viet Nam (FPT, Viettel, VNPT...) THUONG cap IP dong (thay
 *   doi khi mat dien, khoi dong lai modem, hoac dinh ky vai ngay/vai tuan).
 *   Neu IP nha ban doi, ban se bi chan ra khoi trang admin cho toi khi cap
 *   nhat lai ADMIN_ALLOWED_IPS - kiem tra IP hien tai tai whatismyip.com va
 *   sua bien moi truong tren Render/host neu bi khoa nham.
 * - "Chung IP mang / chung nha" (vd dung chung WiFi/4G voi nguoi khac) nghia
 *   la ho CUNG co IP giong ban (IP cong khai la cua ca mang, khong phai
 *   rieng tung thiet bi) - middleware nay KHONG the phan biet duoc giua ban
 *   va nguoi dung chung mang, vi ve mat ky thuat 2 nguoi do co CUNG 1 dia
 *   chi IP cong khai. Day la gioi han vat ly cua co che loc theo IP, khong
 *   co cach nao khac de phan biet "ban" va "nguoi dung chung WiFi" chi bang
 *   dia chi IP - neu can phan biet chi tiet hon, phai dung PIN/2FA (da co)
 *   lam lop bao ve chinh, IP whitelist chi la lop phu.
 */
/** Kiem tra 1 IP co nam trong danh sach cho phep hay khong (dung lai o auth.controller.js de bao ve rieng username admin) */
const isIpAllowed = (ip) => {
  const allowList = String(process.env.ADMIN_ALLOWED_IPS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (allowList.length === 0) return true; // Chua cau hinh -> khong chan ai
  return allowList.includes(String(ip || '').replace('::ffff:', ''));
};

const restrictAdminIp = (req, res, next) => {
  if (isIpAllowed(req.ip)) return next();

  console.warn(`[security] Chan truy cap admin tu IP la: ${req.ip}`);
  return next(new AppError('Bạn không có quyền truy cập khu vực này.', 403));
};

module.exports = restrictAdminIp;
module.exports.isIpAllowed = isIpAllowed;
