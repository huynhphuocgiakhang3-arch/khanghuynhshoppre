const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Giong middleware `protect` nhung KHONG BAO GIO chan request neu khong co
 * token/token sai - chi co gang gan req.user NEU dang nhap hop le, dung cho
 * cac route public (danh sach san pham, chi tiet san pham) de co the hien
 * thi gia uu dai VIP cho khach dang nhap, nhung khach vang lai (chua dang
 * nhap) van xem duoc binh thuong.
 *
 * LUU Y BAO MAT: day CHI phuc vu HIEN THI. Gia thuc te khach phai tra luon
 * duoc tinh lai tu dau o server khi tao don hang that su (xem
 * order.controller.js / serviceOrder.controller.js), khong bao gio tin
 * tuong bat ky gia nao tu client gui len.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.status !== 'banned') {
      req.user = user;
    }
  } catch (err) {
    // Token sai/het han -> coi nhu khach vang lai, khong nem loi
  }
  next();
};

module.exports = optionalAuth;
