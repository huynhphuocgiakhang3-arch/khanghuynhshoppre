const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { notifyBalanceAnomaly, notifySecurityAlert } = require('./telegram.service');

/**
 * ===========================================================================
 * ANTI-CRACK SERVICE
 * ===========================================================================
 * THANH THAT VE GIOI HAN: khong co he thong nao "khong bao gio bi crack
 * tuyet doi 100%" - bat ky ai noi vay deu dang ban ao tuong bao mat. Nhung
 * gi module nay lam duoc THAT SU, khong phong dai:
 *
 * 1) BAO DONG NGUONG (threshold alert): moi khi so du 1 tai khoan thay doi
 *    qua 1 nghiep vu hop le cua he thong (mua hang, nap tien, admin dieu
 *    chinh...) va do lech > 150.000d, bao ngay cho Admin qua Telegram de
 *    biet & doi soat thu cong neu thay bat thuong - day la lop "quan sat",
 *    khong tu dong khoa tai khoan (tranh khoa nham khach hang that).
 *
 * 2) DOI CHIEU SO CAI (ledger reconciliation) - day moi la co che PHAT HIEN
 *    CRACK THAT SU: neu ai do CHINH THANG so du trong MongoDB (vi du co
 *    duoc quyen truy cap DB truc tiep, hoac khai thac 1 loi bao mat khac de
 *    bypass toan bo API cua he thong), so du (User.balance) se KHONG con
 *    khop voi tong cong don cua toan bo lich su Transaction (Transaction
 *    la "so cai" ghi lai MOI thay doi hop le, khong bao gio bi xoa). Ham
 *    verifyLedgerIntegrity() duoc goi dinh ky (server.js) de quet toan bo
 *    user va bao CRITICAL ngay khi phat hien sai lech - day la dau hieu
 *    RO RANG NHAT cua viec bi can thiep truc tiep vao co so du lieu.
 * ===========================================================================
 */

const ANOMALY_THRESHOLD = 150000; // Nguong bien dong "bat thuong" can bao (VND)
const LEDGER_EPSILON = 1; // Sai so lam tron cho phep (VND) khi doi chieu so cai

/**
 * Goi sau MOI thao tac hop le lam thay doi so du (mua hang, nap tien, admin
 * dieu chinh...) de kiem tra do lech co vuot nguong "bat thuong" hay khong.
 * KHONG chan/rollback giao dich (giao dich da hop le va da xu ly xong), chi
 * co chuc nang CANH BAO de Admin de y nhung tai khoan co bien dong lon.
 */
const checkBalanceAnomaly = async (user, balanceBefore, balanceAfter, source) => {
  const diff = Number(balanceAfter) - Number(balanceBefore);
  if (Math.abs(diff) <= ANOMALY_THRESHOLD) return;

  await notifyBalanceAnomaly({
    username: user.username,
    userId: user._id,
    balanceBefore,
    balanceAfter,
    diff,
    source,
    reason: `Biến động vượt ngưỡng cảnh báo (${ANOMALY_THRESHOLD.toLocaleString('vi-VN')}đ) qua nghiệp vụ hợp lệ "${source}". Đây là cảnh báo mang tính quan sát, không có nghĩa tài khoản đã bị crack.`,
  });
};

/**
 * Doi chieu so du that te (User.balance) voi so du duoc suy ra tu SO CAI
 * giao dich (tong cac Transaction status='success' cua user do). Neu lech
 * qua LEDGER_EPSILON -> rat co the balance da bi ghi de TRUC TIEP vao DB,
 * bo qua toan bo luong nghiep vu cua ung dung (dau hieu crack ro rang nhat).
 *
 * Luu y: gia tri khoi diem (truoc giao dich dau tien) luon la 0 vi User moi
 * tao balance mac dinh = 0 va CHI co the thay doi thong qua cac luong da
 * duoc ghi Transaction (mua hang, nap tien, admin dieu chinh).
 */
const verifyLedgerIntegrity = async () => {
  const users = await User.find({}).select('_id username balance').lean();
  const anomalies = [];

  for (const user of users) {
    const agg = await Transaction.aggregate([
      { $match: { user: user._id, status: 'success' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);

    const ledgerBalance = agg[0]?.sum || 0;
    const drift = user.balance - ledgerBalance;

    if (Math.abs(drift) > LEDGER_EPSILON) {
      anomalies.push({ user, ledgerBalance, drift });
    }
  }

  if (anomalies.length > 0) {
    const details = anomalies
      .slice(0, 10)
      .map(
        (a) =>
          `• <b>${a.user.username}</b>: DB=${a.user.balance.toLocaleString('vi-VN')}đ vs Sổ cái=${a.ledgerBalance.toLocaleString('vi-VN')}đ (lệch ${a.drift >= 0 ? '+' : ''}${a.drift.toLocaleString('vi-VN')}đ)`
      )
      .join('\n');

    await notifySecurityAlert({
      title: 'PHÁT HIỆN SAI LỆCH SỔ CÁI - NGHI NGỜ CAN THIỆP TRỰC TIẾP VÀO DATABASE',
      details:
        `Tìm thấy <b>${anomalies.length}</b> tài khoản có số dư KHÔNG khớp với lịch sử giao dịch hợp lệ:\n${details}\n\n` +
        `👉 Đây gần như chắc chắn là dấu hiệu số dư đã bị chỉnh sửa trực tiếp trong MongoDB, bỏ qua toàn bộ API của hệ thống. Vui lòng kiểm tra ngay quyền truy cập database (connection string, IP whitelist, user DB) và đổi mật khẩu DB nếu nghi ngờ bị lộ.`,
      severity: 'critical',
    });
  }

  return anomalies;
};

/**
 * Khoi dong quet dinh ky (goi 1 lan trong server.js sau khi ket noi DB
 * thanh cong). Mac dinh 15 phut/lan - du nhanh de phat hien som, khong qua
 * tai CPU/DB vi so luong user thuong khong qua lon.
 */
const startPeriodicIntegrityCheck = (intervalMs = 15 * 60 * 1000) => {
  setInterval(() => {
    verifyLedgerIntegrity().catch((err) => console.error('[anti-crack] Loi khi doi chieu so cai:', err.message));
  }, intervalMs);

  // Chay 1 lan ngay khi khoi dong (sau 30s de doi DB/ket noi on dinh) thay vi
  // phai doi du 1 chu ky dau tien.
  setTimeout(() => {
    verifyLedgerIntegrity().catch((err) => console.error('[anti-crack] Loi khi doi chieu so cai:', err.message));
  }, 30 * 1000);
};

module.exports = {
  ANOMALY_THRESHOLD,
  checkBalanceAnomaly,
  verifyLedgerIntegrity,
  startPeriodicIntegrityCheck,
};
