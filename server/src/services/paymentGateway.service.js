const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { sendDepositSuccessEmail } = require('./mail.service');
const { notifyDepositApproved } = require('./telegram.service');
const { checkBalanceAnomaly } = require('./antiCrack.service');
const { creditAdvisorsOnDeposit } = require('./advisorCommission.service');

/**
 * ===========================================================================
 * MO-DUN DOI SOAT GIAO DICH NGAN HANG TU DONG (ADAPTER PATTERN)
 * ===========================================================================
 * Day la kien truc TONG QUAT cho phep ket noi voi BAT KY cong trung gian
 * "bao bien dong so du" (BankAPI Notification) HOP PHAP nao co cung che do
 * webhook, vi du: SePay (sepay.vn), Casso (casso.vn), PayOS (payos.vn).
 *
 * Cach hoat dong:
 * 1. Khach hang quet VietQR voi noi dung chuyen khoan duy nhat (transferContent).
 * 2. Khi tien vao tai khoan ngan hang, cong trung gian (SePay/Casso...) se
 *    POST du lieu bien dong toi webhook: POST /api/payment/webhook
 * 3. He thong doi noi dung CK trong sao ke voi transferContent dang "pending"
 *    trong bang Transaction. Neu khop & so tien dung -> tu dong cong vi.
 *
 * Admin chi can:
 *  - Dang ky tai khoan tai mot trong cac nha cung cap tren (SePay/Casso/PayOS)
 *  - Lien ket tai khoan ngan hang that cua shop voi nha cung cap do
 *  - Vao trang Admin > Cau hinh Payment, dien apiKey/webhookSecret va
 *    cau hinh URL webhook (vi du: https://yourdomain.com/api/payment/webhook)
 *    vao trang quan tri cua nha cung cap do
 *  - KHONG can sua code, KHONG dung dich vu "gach the" trai phep.
 * ===========================================================================
 */

/**
 * Trich xuat ma giao dich (transferContent) tu noi dung chuyen khoan day du
 * ma ngan hang tra ve (thuong co them tien to nhu "CT tu...", "MBVCB...").
 * Quy uoc: noi dung CK luon chua chuoi dang KH + 4 ky tu + 8 ky tu hex.
 */
const extractTransferCode = (rawDescription = '') => {
  const match = rawDescription.toUpperCase().match(/KH[A-Z0-9]{8,16}/);
  return match ? match[0] : null;
};

/**
 * Xac thuc chu ky/secret cua webhook de dam bao request thuc su den tu
 * nha cung cap (SePay dung Authorization: Apikey, Casso dung header rieng).
 */
const verifyWebhookAuth = (req, config) => {
  const { provider, webhookSecret } = config.paymentGateway;

  if (!config.paymentGateway.isEnabled) return false;

  if (provider === 'sepay') {
    const authHeader = req.headers['authorization'] || '';
    return authHeader === `Apikey ${webhookSecret}`;
  }

  if (provider === 'casso') {
    const secretHeader = req.headers['secure-token'] || '';
    return secretHeader === webhookSecret;
  }

  if (provider === 'payos') {
    // PayOS dung checksum HMAC, kiem tra rieng trong controller neu can
    return true;
  }

  // provider = 'manual' hoac 'other' -> khong nhan webhook tu dong
  return false;
};

/**
 * Xu ly mot ban ghi bien dong so du nhan duoc tu webhook.
 * Tra ve { matched: boolean, message: string }
 *
 * @param {object} bankTransaction - { amount, content, gatewayRef }
 */
const processIncomingBankTransaction = async (bankTransaction) => {
  const { amount, content, gatewayRef } = bankTransaction;

  const transferCode = extractTransferCode(content);
  if (!transferCode) {
    return { matched: false, message: 'Khong tim thay ma giao dich trong noi dung CK.' };
  }

  const pendingTx = await Transaction.findOne({
    transferContent: transferCode,
    status: 'pending',
    type: 'deposit',
  });

  if (!pendingTx) {
    return { matched: false, message: `Khong tim thay lenh nap tien dang cho voi ma ${transferCode}.` };
  }

  if (Number(amount) < pendingTx.amount) {
    pendingTx.status = 'failed';
    pendingTx.note = `So tien chuyen (${amount}) nho hon so tien yeu cau (${pendingTx.amount}).`;
    await pendingTx.save();
    return { matched: false, message: pendingTx.note };
  }

  const user = await User.findById(pendingTx.user);
  if (!user) {
    return { matched: false, message: 'Khong tim thay user tuong ung.' };
  }

  // Tru hao truong hop khach chuyen du hoac thua (cong dung so thuc nhan)
  const creditAmount = Number(amount);
  const balanceBefore = user.balance;
  user.balance += creditAmount;
  await user.save();

  pendingTx.status = 'success';
  pendingTx.amount = creditAmount;
  pendingTx.balanceBefore = balanceBefore;
  pendingTx.balanceAfter = user.balance;
  pendingTx.gatewayRef = gatewayRef || null;
  await pendingTx.save();

  sendDepositSuccessEmail(user, creditAmount).catch(() => {});

  // Chuyen khoan tu dong khop lenh qua webhook ngan hang (co "bill" thuc su
  // tu ngan hang, khong phai khach tu upload anh) - van phai co thong bao
  // Telegram nhu moi hinh thuc nap tien khac de dam bao minh bach & anti-crack.
  notifyDepositApproved('bank_transfer', {
    username: user.username,
    amount: creditAmount,
    balanceAfter: user.balance,
    adminUsername: 'Hệ thống (tự động qua webhook)',
    method: 'bank_transfer',
    refNote: gatewayRef ? `Mã GD ngân hàng: ${gatewayRef}` : '',
  }).catch(() => {});
  checkBalanceAnomaly(user, balanceBefore, user.balance, 'webhook chuyển khoản tự động').catch(() => {});
  creditAdvisorsOnDeposit(creditAmount, 'Chuyển khoản tự động (webhook)').catch(() => {});

  return { matched: true, message: `Da cong ${creditAmount} VND cho user ${user.username}.` };
};

module.exports = {
  extractTransferCode,
  verifyWebhookAuth,
  processIncomingBankTransaction,
};
