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
  // Chiem the cao bang update nguyen tu (chi chuyen pending -> success neu
  // dung luc no VAN dang pending) - xem giai thich chi tiet o
  // depositApproval.service.js#approveDepositById, ap dung tuong tu de
  // chan trung 100% truong hop cong tien 2 lan cho cung 1 the.
  const claimed = await CardTopup.findOneAndUpdate(
    { _id: cardTopupId, status: 'pending' },
    { $set: { status: 'success', processedAt: new Date(), ...(adminUserId ? { processedBy: adminUserId } : {}) } },
    { new: false }
  );
  if (!claimed) {
    const exists = await CardTopup.exists({ _id: cardTopupId });
    if (!exists) throw new AppError('Khong tim thay the nay.', 404);
    throw new AppError('Thẻ này đã được xử lý trước đó.', 400);
  }

  const user = await User.findByIdAndUpdate(claimed.user, { $inc: { balance: claimed.amount } }, { new: true });
  if (!user) throw new AppError('Khong tim thay user.', 404);

  const balanceBefore = user.balance - claimed.amount;
  const transactionDoc = await Transaction.create({
    user: user._id,
    type: 'deposit',
    amount: claimed.amount,
    balanceBefore,
    balanceAfter: user.balance,
    status: 'success',
    method: 'card',
    note: `Nạp thẻ cào ${claimed.cardType} - mệnh giá ${claimed.amount.toLocaleString('vi-VN')}đ`,
  });

  await CardTopup.updateOne({ _id: claimed._id }, { $set: { relatedTransaction: transactionDoc._id } });
  const cardTopup = { ...claimed.toObject(), status: 'success', relatedTransaction: transactionDoc._id };

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
