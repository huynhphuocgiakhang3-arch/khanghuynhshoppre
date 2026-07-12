const axios = require('axios');

const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/list';

/**
 * ===========================================================================
 * KIEM TRA THANH TOAN CHU DONG (PULL) QUA SEPAY API
 * ===========================================================================
 * Khac voi paymentGateway.service.js (dang cho SePay/Casso CHU DONG bao ve
 * qua webhook - PUSH), module nay de FRONTEND chu dong hoi ("co tien chua?")
 * moi 5 giay/lan, va server se tu goi sang SePay de tra loi ngay lap tuc,
 * khong can cho webhook (phu hop khi chua kip cau hinh webhook, hoac muon
 * co phan hoi real-time hon tren giao dien khi khach vua chuyen khoan xong).
 *
 * Can co tai khoan SePay (mien phi) da lien ket voi tai khoan ngan hang that
 * (TPBank) cua ban, va 1 API Token tao tai my.sepay.vn -> Cau hinh cong ty ->
 * API Access. Token nay dien vao bien moi truong BANK_TOKEN (.env), KHONG
 * BAO GIO dua vao code/frontend.
 *
 * Gioi han cua SePay: toi da 2 request/giay cho moi token - co cache ngan
 * (CACHE_TTL_MS) de nhieu khach cung poll cung luc khong lam vuot qua nguong
 * nay (chia se chung 1 lan goi API thuc su moi vai giay).
 * ===========================================================================
 */

let cachedTransactions = null;
let cachedAt = 0;
const CACHE_TTL_MS = 3000;

/**
 * Lay danh sach giao dich gan day tu SePay (co cache ngan de tranh goi API
 * qua nhieu lan khi co nhieu nguoi cung poll 1 luc).
 */
const fetchRecentTransactions = async () => {
  const now = Date.now();
  if (cachedTransactions && now - cachedAt < CACHE_TTL_MS) {
    return cachedTransactions;
  }

  const token = process.env.BANK_TOKEN;
  if (!token) {
    throw new Error('Chua cau hinh BANK_TOKEN trong bien moi truong.');
  }

  const { data } = await axios.get(SEPAY_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 20 },
    timeout: 10000,
  });

  cachedTransactions = data?.transactions || [];
  cachedAt = now;
  return cachedTransactions;
};

/**
 * Tim 1 giao dich ngan hang trong danh sach gan day co noi dung chuyen
 * khoan CHUA dung `code` VA so tien vao (amount_in) >= `minAmount`.
 * Tra ve null neu chua tim thay.
 */
const findMatchingTransaction = async (code, minAmount) => {
  const transactions = await fetchRecentTransactions();
  const upperCode = String(code).toUpperCase();

  return (
    transactions.find((t) => {
      const content = String(t.transaction_content || '').toUpperCase();
      const amountIn = Number(t.amount_in || 0);
      return content.includes(upperCode) && amountIn >= Number(minAmount);
    }) || null
  );
};

module.exports = { fetchRecentTransactions, findMatchingTransaction };
