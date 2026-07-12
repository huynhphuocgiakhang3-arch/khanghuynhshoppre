const axios = require('axios');
const SystemConfig = require('../models/SystemConfig');

/**
 * Tao URL anh QR code VietQR dong dua tren so tien va noi dung chuyen khoan.
 * Su dung dich vu cong khai img.vietqr.io - khong can API key, khong gioi han
 * (tham khao: https://www.vietqr.io/danh-sach-api/api-tao-ma-vietqr/)
 *
 * Cau hinh ngan hang (BIN, so tai khoan, ten) duoc lay tu SystemConfig trong DB,
 * Admin co the sua truc tiep tren web Admin ma khong can dong code.
 *
 * @param {number} amount - So tien can chuyen (VND)
 * @param {string} transferContent - Noi dung chuyen khoan (dung de doi soat)
 * @returns {Promise<{qrImageUrl: string, bankInfo: object}>}
 */
const generateVietQR = async (amount, transferContent) => {
  const config = await SystemConfig.getSingleton();
  
  // Use environment variables as fallback to ensure correct bank info
  const bin = process.env.VIETQR_BANK_BIN || config.bank.bin;
  const accountNo = process.env.VIETQR_ACCOUNT_NO || config.bank.accountNo;
  const accountName = process.env.VIETQR_ACCOUNT_NAME || config.bank.accountName;
  const template = process.env.VIETQR_TEMPLATE || config.bank.template;
  const bankName = process.env.VIETQR_BANK_NAME || config.bank.bankName;
  const depositNote = config.bank.depositNote;
  const customQrImage = config.bank.customQrImage;

  if (!accountNo || !bin) {
    throw new Error('Chua cau hinh thong tin ngan hang. Vui long lien he Admin.');
  }

  const encodedAccountName = encodeURIComponent(accountName || '');
  const encodedContent = encodeURIComponent(transferContent || '');

  // Neu Admin da upload anh QR rieng (vd chup truc tiep tu app ngan hang),
  // uu tien dung anh do thay vi sinh QR dong. Luu y: anh tinh se KHONG tu
  // dong nhung so tien/noi dung CK vao QR nhu QR dong - khach van phai tu
  // nhap dung so tien va noi dung khi chuyen khoan.
  if (customQrImage) {
    return {
      qrImageUrl: customQrImage,
      bankInfo: { bankName, accountNo, accountName, amount, transferContent, depositNote },
    };
  }

  // VietQR Quick Link API: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-{TEMPLATE}.png
  // Dich vu render anh nay ho tro tat ca ngan hang thanh vien Napas (bao gom
  // MB Bank voi BIN 970422), khong can API key.
  const qrImageUrl =
    `https://img.vietqr.io/image/${bin}-${accountNo}-${template || 'compact2'}.png` +
    `?amount=${Math.round(amount)}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;

  return {
    qrImageUrl,
    bankInfo: {
      bankName,
      accountNo,
      accountName,
      amount,
      transferContent,
      depositNote,
    },
  };
};

/**
 * (Tuy chon) Goi VietQR API chinh thuc de lay du lieu QR dang base64/EMV string
 * neu can nhung tinh nang nang cao hon (vd: embed QR vao PDF).
 * API nay can dang ky client-id/api-key tai vietqr.io - de o day duoi dang
 * tien ich mo rong, mac dinh he thong dung generateVietQR() o tren la du dung.
 */
const generateVietQRAdvanced = async (amount, transferContent) => {
  const config = await SystemConfig.getSingleton();
  const { bin, accountNo, accountName } = config.bank;

  const response = await axios.post(
    'https://api.vietqr.io/v2/generate',
    {
      accountNo,
      accountName,
      acqId: bin,
      amount: Math.round(amount),
      addInfo: transferContent,
      template: 'compact2',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        // Neu Admin co dang ky client-id/api-key tai vietqr.io thi them vao day
        ...(process.env.VIETQR_CLIENT_ID && { 'x-client-id': process.env.VIETQR_CLIENT_ID }),
        ...(process.env.VIETQR_API_KEY && { 'x-api-key': process.env.VIETQR_API_KEY }),
      },
      timeout: 10000,
    }
  );

  return response.data;
};

/**
 * Tao QR code dong su dung VietQR Token API
 * Su dung token de goi API VietQR tao QR code theo so tien tu chon
 * Giup khach hang quet QR dung so tien va tu dong cong tien khong can admin duyet
 *
 * @param {number} amount - So tien can chuyen (VND)
 * @param {string} transferContent - Noi dung chuyen khoan (dung de doi soat)
 * @returns {Promise<{qrImageUrl: string, bankInfo: object}>}
 */
const generateVietQRWithToken = async (amount, transferContent) => {
  const config = await SystemConfig.getSingleton();
  
  // Use environment variables as fallback to ensure correct bank info
  const bin = process.env.VIETQR_BANK_BIN || config.bank.bin;
  const accountNo = process.env.VIETQR_ACCOUNT_NO || config.bank.accountNo;
  const accountName = process.env.VIETQR_ACCOUNT_NAME || config.bank.accountName;
  const bankName = process.env.VIETQR_BANK_NAME || config.bank.bankName;
  const depositNote = config.bank.depositNote;

  if (!accountNo || !bin) {
    throw new Error('Chua cau hinh thong tin ngan hang. Vui long lien he Admin.');
  }

  if (!process.env.VIETQR_TOKEN) {
    throw new Error('Chua cau hinh VIETQR_TOKEN. Vui long lien he Admin.');
  }

  const encodedAccountName = encodeURIComponent(accountName || '');
  const encodedContent = encodeURIComponent(transferContent || '');

  // Goi API VietQR voi token de tao QR code dong
  const response = await axios.post(
    'https://api.vietqr.io/v2/generate',
    {
      accountNo,
      accountName,
      acqId: bin,
      amount: Math.round(amount),
      addInfo: transferContent,
      template: 'compact2',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VIETQR_TOKEN}`,
      },
      timeout: 10000,
    }
  );

  const qrData = response.data;

  // Neu API tra ve QR URL hoac base64
  const qrImageUrl = qrData.data?.qrDataURL || qrData.data?.qrImage || 
    `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;

  return {
    qrImageUrl,
    bankInfo: {
      bankName,
      accountNo,
      accountName,
      amount,
      transferContent,
      depositNote,
    },
  };
};

/**
 * Kiem tra lich su giao dich ngan hang su dung VietQR Token
 * De tu dong doi soat va cong tien khi user da chuyen khoan
 *
 * @param {string} transferContent - Noi dung chuyen khoan can tim
 * @returns {Promise<{found: boolean, amount: number, transactionDate: string}>}
 */
const checkTransactionByContent = async (transferContent) => {
  if (!process.env.VIETQR_TOKEN) {
    throw new Error('Chua cau hinh VIETQR_TOKEN. Vui long lien he Admin.');
  }

  try {
    // Goi API VietQR de lay lich su giao dich
    const response = await axios.get(
      'https://api.vietqr.io/v2/transactions',
      {
        headers: {
          'Authorization': `Bearer ${process.env.VIETQR_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const transactions = response.data?.data || [];

    // Tim giao dich chua noi dung chuyen khoan
    const matchedTx = transactions.find(tx => 
      tx.description && tx.description.toUpperCase().includes(transferContent.toUpperCase())
    );

    if (matchedTx) {
      return {
        found: true,
        amount: Number(matchedTx.amount),
        transactionDate: matchedTx.transactionDate,
      };
    }

    return { found: false };
  } catch (error) {
    console.error('Error checking VietQR transaction:', error.message);
    // Neu API khong ho tro, tra ve not found de fallback ve manual
    return { found: false };
  }
};

module.exports = { generateVietQR, generateVietQRAdvanced, generateVietQRWithToken, checkTransactionByContent };
