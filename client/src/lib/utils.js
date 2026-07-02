/** Format so tien sang dang VND co dau phan cach hang nghin, vi du 150000 -> "150.000 đ" */
export const formatVND = (amount) => {
  if (amount === null || amount === undefined) return '0 đ';
  return `${Number(amount).toLocaleString('vi-VN')} đ`;
};

/** Format ngay gio sang dang Viet Nam, vi du "26/06/2026 14:30" */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Cat ngan chuoi qua dai, them "..." o cuoi */
export const truncate = (str, maxLength = 80) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

/** Map trang thai don hang sang label + mau hien thi tieng Viet */
export const ORDER_STATUS_MAP = {
  pending: { label: 'Đang xử lý', color: 'text-gold-500 bg-gold-500/10' },
  paid: { label: 'Đã thanh toán', color: 'text-green-400 bg-green-400/10' },
  delivered: { label: 'Đã giao', color: 'text-blue-400 bg-blue-400/10' },
  cancelled: { label: 'Đã hủy', color: 'text-mist-400 bg-mist-400/10' },
  failed: { label: 'Thất bại', color: 'text-red-400 bg-red-400/10' },
};

/** Map loai giao dich sang label tieng Viet */
export const TX_TYPE_MAP = {
  deposit: { label: 'Nạp tiền', sign: '+' },
  purchase: { label: 'Mua hàng', sign: '-' },
  refund: { label: 'Hoàn tiền', sign: '+' },
  admin_adjust: { label: 'Admin điều chỉnh', sign: '' },
};
