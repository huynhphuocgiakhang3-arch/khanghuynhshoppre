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
  const transaction = await Transaction.findOne({ _id: transactionId, type: 'deposit' });
  if (!transaction) throw new AppError('Khong tim thay giao dich.', 404);
  if (transaction.status !== 'pending') {
    throw new AppError('Giao dich nay da duoc xu ly truoc do.', 400);
  }

  const user = await User.findById(transaction.user);
  if (!user) throw new AppError('Khong tim thay user.', 404);

  const balanceBefore = user.balance;
  user.balance += transaction.amount;
  await user.save();

  transaction.status = 'success';
  transaction.balanceBefore = balanceBefore;
  transaction.balanceAfter = user.balance;
  await transaction.save();

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
