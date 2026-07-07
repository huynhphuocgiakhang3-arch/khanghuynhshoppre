const CardTopup = require('../models/CardTopup');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { notifyDepositApproved, notifyDepositRejected } = require('./telegram.service');
const { checkBalanceAnomaly } = require('./antiCrack.service');
const { creditAdvisorsOnDeposit } = require('./advisorCommission.service');

/**
 * Logic DUYET 1 the cao - dung chung boi admin.cardTopup.controller.js (nut
 * tren trang admin) VA telegramBot.service.js (nut ngay duoi tin nhan
 * Telegram), dam bao CHI CO 1 nguon logic duy nhat.
 */
const approveCardTopupById = async (cardTopupId, adminLabel, adminUserId = null) => {
  const cardTopup = await CardTopup.findById(cardTopupId);
  if (!cardTopup) throw new AppError('Khong tim thay the nay.', 404);
  if (cardTopup.status !== 'pending') {
    throw new AppError('Thẻ này đã được xử lý trước đó.', 400);
  }

  const user = await User.findById(cardTopup.user);
  if (!user) throw new AppError('Khong tim thay user.', 404);

  const balanceBefore = user.balance;
  user.balance += cardTopup.amount;
  await user.save();

  const transaction = await Transaction.create({
    user: user._id,
    type: 'deposit',
    amount: cardTopup.amount,
    balanceBefore,
    balanceAfter: user.balance,
    status: 'success',
    method: 'card',
    note: `Nạp thẻ cào ${cardTopup.cardType} - mệnh giá ${cardTopup.amount.toLocaleString('vi-VN')}đ`,
  });

  cardTopup.status = 'success';
  cardTopup.relatedTransaction = transaction._id;
  if (adminUserId) cardTopup.processedBy = adminUserId;
  cardTopup.processedAt = new Date();
  await cardTopup.save();

  notifyDepositApproved('card', {
    username: user.username,
    amount: cardTopup.amount,
    balanceAfter: user.balance,
    adminUsername: adminLabel,
    method: 'card',
    refNote: `${cardTopup.cardType} - Serial: ${cardTopup.serial}`,
  }).catch(() => {});
  checkBalanceAnomaly(user, balanceBefore, user.balance, `duyệt thẻ cào bởi ${adminLabel}`).catch(() => {});
  creditAdvisorsOnDeposit(cardTopup.amount, `Thẻ cào ${cardTopup.cardType}`).catch(() => {});

  return { cardTopup, user };
};

/**
 * Logic TU CHOI 1 the cao - xem ghi chu o approveCardTopupById.
 */
const rejectCardTopupById = async (cardTopupId, adminLabel, note, adminUserId = null) => {
  const cardTopup = await CardTopup.findById(cardTopupId).populate('user', 'username');
  if (!cardTopup) throw new AppError('Khong tim thay the nay.', 404);
  if (cardTopup.status !== 'pending') {
    throw new AppError('Thẻ này đã được xử lý trước đó.', 400);
  }

  cardTopup.status = 'failed';
  cardTopup.adminNote = note || 'Thẻ không hợp lệ hoặc đã qua sử dụng.';
  if (adminUserId) cardTopup.processedBy = adminUserId;
  cardTopup.processedAt = new Date();
  await cardTopup.save();

  notifyDepositRejected('card', {
    username: cardTopup.user?.username || 'N/A',
    amount: cardTopup.amount,
    adminUsername: adminLabel,
    reason: cardTopup.adminNote,
  }).catch(() => {});

  return { cardTopup };
};

module.exports = { approveCardTopupById, rejectCardTopupById };
