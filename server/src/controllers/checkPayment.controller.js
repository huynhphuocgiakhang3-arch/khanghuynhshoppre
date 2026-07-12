const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { findMatchingTransaction } = require('../services/sepayCheck.service');
const { processIncomingBankTransaction } = require('../services/paymentGateway.service');

/**
 * @route GET /api/check-payment?code=...&amount=...
 * @desc Frontend goi API nay moi 5 giay/lan (polling) sau khi hien QR de
 *       kiem tra xem khach da chuyen khoan thanh cong hay chua. Khac voi
 *       webhook (server bi dong cho ngan hang bao), API nay CHU DONG hoi
 *       sang SePay moi lan duoc goi.
 *
 * BAO MAT QUAN TRONG:
 * - Bat buoc dang nhap (`protect`), va CHI duoc kiem tra giao dich cua
 *   CHINH nguoi dang goi API (transaction.user phai khop req.user._id) -
 *   tranh truong hop do "mo" giao dich cua nguoi khac bang cach doan code.
 * - So tien THAT SU duoc cong luon lay tu Transaction da luu trong DB tu
 *   luc tao lenh (transaction.amount), KHONG BAO GIO tin so `amount` tren
 *   query string do client tu gui len - chi dung no de doi chieu hien thi.
 */
const checkPayment = catchAsync(async (req, res, next) => {
  const { code } = req.query;
  if (!code) return next(new AppError('Thiếu mã giao dịch (code).', 400));

  const transaction = await Transaction.findOne({
    transferContent: code,
    user: req.user._id,
    type: 'deposit',
  });

  if (!transaction) {
    return next(new AppError('Không tìm thấy giao dịch này.', 404));
  }

  // Idempotent: neu da xu ly thanh cong roi (vd webhook da khop truoc do,
  // hoac lan poll truoc da khop) thi tra ve thanh cong ngay, khong goi lai
  // SePay nua.
  if (transaction.status === 'success') {
    return res.status(200).json({
      success: true,
      message: 'Thanh toán thành công',
      data: { balanceAfter: transaction.balanceAfter },
    });
  }

  if (transaction.status !== 'pending') {
    return res.status(200).json({ success: false, message: 'Giao dịch đã bị hủy hoặc hết hạn.' });
  }

  try {
    const match = await findMatchingTransaction(code, transaction.amount);

    if (!match) {
      return res.status(200).json({ success: false, message: 'Đang chờ thanh toán' });
    }

    // Dung lai chinh logic da co san o paymentGateway.service.js (dung
    // chung cho ca webhook lan polling) de dam bao 1 nguon xu ly duy nhat:
    // tim pending Transaction theo code, cong tien, gui Telegram, cong hoa
    // hong Co van, kiem tra anti-crack... KHONG viet lai logic cong tien o day.
    const result = await processIncomingBankTransaction({
      amount: Number(match.amount_in),
      content: match.transaction_content,
      gatewayRef: match.id || match.reference_number || null,
    });

    if (!result.matched) {
      // Vd so tien chuyen nho hon yeu cau -> processIncomingBankTransaction
      // da tu danh dau transaction 'failed' va ghi ro ly do trong result.message
      return res.status(200).json({ success: false, message: result.message || 'Đang chờ thanh toán' });
    }

    const updated = await Transaction.findById(transaction._id);
    return res.status(200).json({
      success: true,
      message: 'Thanh toán thành công',
      data: { balanceAfter: updated.balanceAfter },
    });
  } catch (error) {
    // Loi goi SePay (mat mang, token sai, vuot rate limit...) -> coi nhu
    // "chua thay", KHONG bao loi 500 ra frontend de tranh lam gian doan
    // polling - chi log lai phia server de debug.
    console.error('[check-payment] Lỗi khi gọi SePay API:', error.response?.data || error.message);
    return res.status(200).json({ success: false, message: 'Đang chờ thanh toán' });
  }
});

module.exports = { checkPayment };
