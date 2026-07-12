const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { notifyDepositApproved, notifyDepositRejected } = require('./telegram.service');
const { checkBalanceAnomaly } = require('./antiCrack.service');
const { creditAdvisorsOnDeposit } = require('./advisorCommission.service');

/**
 * Logic DUYET 1 lenh nap QR - dung chung boi admin.deposit.controller.js
 * (khi bam nut tren trang admin) VA telegramBot.service.js (khi bam nut
 * ngay duoi tin nhan Telegram) de dam bao CHI CO 1 nguon logic duy nhat,
 * khong bao gio lech nhau giua 2 duong duyet.
 *
 * @param {string} transactionId
 * @param {string} adminLabel - ten hien thi cua nguoi duyet (username admin
 *   hoac "Admin (qua Telegram)" neu duyet tu bot) de ghi vao thong bao.
 */
const approveDepositById = async (transactionId, adminLabel) => {
  // "Chiem" giao dich bang 1 lenh update NGUYEN TU: chi chuyen pending ->
  // success neu dung luc no VAN dang la pending. Neu 2 nguon duyet cung
  // luc (vd Admin bam duyet tren web dung luc ban 1 giay bam duyet qua
  // Telegram) thi CHI 1 trong 2 request "chiem" duoc, request con lai se
  // nhan claimed = null va bao loi "da duoc xu ly truoc do" ngay lap tuc -
  // tranh tuyet doi truong hop cong tien 2 LAN cho cung 1 giao dich.
  const claimed = await Transaction.findOneAndUpdate(
    { _id: transactionId, type: 'deposit', status: 'pending' },
    { $set: { status: 'success' } },
    { new: false }
  );
  if (!claimed) {
    const exists = await Transaction.exists({ _id: transactionId, type: 'deposit' });
    if (!exists) throw new AppError('Khong tim thay giao dich.', 404);
    throw new AppError('Giao dich nay da duoc xu ly truoc do.', 400);
  }

  // Cong tien bang $inc (nguyen tu) thay vi doc-roi-ghi, tranh mat cap nhat
  // neu user nay dong thoi co giao dich khac cung dang duoc xu ly.
  const user = await User.findByIdAndUpdate(claimed.user, { $inc: { balance: claimed.amount } }, { new: true });
  if (!user) throw new AppError('Khong tim thay user.', 404);

  const balanceBefore = user.balance - claimed.amount;
  await Transaction.updateOne(
    { _id: claimed._id },
    { $set: { balanceBefore, balanceAfter: user.balance } }
  );
  const transaction = { ...claimed.toObject(), status: 'success', balanceBefore, balanceAfter: user.balance };

  notifyDepositApproved('vietqr', {
    username: user.username,
    amount: transaction.amount,
    balanceAfter: user.balance,
    adminUsername: adminLabel,
    method: 'vietqr',
    refNote: transaction.transferContent || '',
  }).catch(() => {});
  checkBalanceAnomaly(user, balanceBefore, user.balance, `duyệt nạp QR bởi ${adminLabel}`).catch(() => {});
  creditAdvisorsOnDeposit(transaction.amount, 'Chuyển khoản QR').catch(() => {});

  return { transaction, user };
};

/**
 * Logic TU CHOI 1 lenh nap QR - xem ghi chu o approveDepositById.
 * @param {string} reasonLabel - nhan ly do ngan gon (vd "Bill giả", "Trục
 *   trặc kỹ thuật") hien thi truc tiep tren nut bam Telegram.
 */
const rejectDepositById = async (transactionId, adminLabel, reasonLabel) => {
  const transaction = await Transaction.findOne({ _id: transactionId, type: 'deposit' }).populate('user', 'username');
  if (!transaction) throw new AppError('Khong tim thay giao dich.', 404);
  if (transaction.status !== 'pending') {
    throw new AppError('Giao dich nay da duoc xu ly truoc do.', 400);
  }

  transaction.status = 'failed';
  transaction.note = reasonLabel || 'Ảnh xác nhận không hợp lệ hoặc không khớp số tiền.';
  await transaction.save();

  notifyDepositRejected('vietqr', {
    username: transaction.user?.username || 'N/A',
    amount: transaction.amount,
    adminUsername: adminLabel,
    reason: transaction.note,
  }).catch(() => {});

  return { transaction };
};

module.exports = { approveDepositById, rejectDepositById };
