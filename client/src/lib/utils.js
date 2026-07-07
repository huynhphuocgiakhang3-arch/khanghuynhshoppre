/** Format so tien sang dang VND co dau phan cach hang nghin, vi du 150000 -> "150.000 đ" */
/**
 * Sua loi tai file giao hang bi doi ten thanh chuoi ky tu ngau nhien khong
 * duoi (vd "gx2pk3jnsm2dglybnf3v"): file 'raw' tren Cloudinary khong tu kem
 * ten/duoi file khi tai ve qua link truc tiep (thuoc tinh HTML `download`
 * KHONG hoat dong voi URL khac domain). Ham nay chen transformation
 * `fl_attachment:<ten file>` vao URL Cloudinary, buoc server tra ve header
 * Content-Disposition dung ten that + giu duoi file goc (neu doc duoc tu URL)
 * - hoat dong ca voi file da tung upload truoc day, khong can upload lai.
 */
export const toCloudinaryDownloadUrl = (url, filename) => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('fl_attachment')) return url;

  const extMatch = url.match(/\.([a-zA-Z0-9]{1,6})(?:\?.*)?$/);
  const ext = extMatch ? extMatch[1] : '';

  // QUAN TRONG: gia tri sau "fl_attachment:" nam trong PHAN DUONG DAN transformation
  // cua Cloudinary, noi cac ky tu nhu dau phay ",", dau hai cham ":", dau "/", "#", "%",
  // ("()[]", va nhat la KY TU NGOAI ASCII (emoji, chu co dau...) du da duoc encodeURIComponent
  // van co the khien Cloudinary parse sai transformation string va tra ve loi 400 Bad Request.
  // -> De dam bao KHONG BAO GIO con loi 400 vi ten file, ta chi giu lai chu cai/so ASCII,
  // dau cach, dau gach ngang, gach duoi va dau cham; MOI ky tu khac (ke ca emoji, dau tieng
  // Viet, dau phay, %, #, :, /, ...) deu bi loai bo hoan toan truoc khi dua vao URL.
  let safeName = String(filename || 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // bo dau tieng Viet/dau phu am (giu lai chu cai goc: a, e, o...)
    .replace(/[^\x00-\x7F]/g, '') // bo TOAN BO ky tu ngoai ASCII con lai (emoji, ky tu dac biet unicode)
    .replace(/[^a-zA-Z0-9 ._-]/g, ' ') // bat ky ky tu nao khong an toan cho Cloudinary -> thay bang khoang trang
    .replace(/\s+/g, ' ')
    .trim();

  if (!safeName) safeName = 'file';
  if (ext && !safeName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    safeName = `${safeName}.${ext}`;
  }

  return url.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(safeName)}/`);
};

/**
 * Tra ve ten file AN TOAN de dat cho thuoc tinh `download` cua the <a> khi tai
 * file qua Blob (xem ham downloadFileAsBlob ben duoi). Khac voi safeName trong
 * toCloudinaryDownloadUrl (phai loai bo emoji/unicode vi no nam trong URL
 * Cloudinary), ten file o day CHI dung de luu tren may nguoi dung nen van giu
 * duoc emoji/tieng Viet co dau binh thuong - chi loai cac ky tu he dieu hanh
 * cam trong ten file (\ / : * ? " < > |).
 */
export const getSafeDownloadFilename = (url, label) => {
  const extMatch = String(url || '').match(/\.([a-zA-Z0-9]{1,6})(?:\?.*)?$/);
  const ext = extMatch ? extMatch[1] : '';
  let name = String(label || 'file').replace(/[\\/:*?"<>|]/g, '').trim() || 'file';
  if (ext && !name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    name = `${name}.${ext}`;
  }
  return name;
};

/**
 * Tai file VE TRUC TIEP bang fetch + Blob thay vi dieu huong toi URL Cloudinary
 * (co gan fl_attachment). Cach nay giai quyet TRIET DE loi 400: khong con phu
 * thuoc vao viec Cloudinary co parse dung transformation string
 * "fl_attachment:<ten file>" hay khong (von rat de vo neu ten file/san pham
 * chua dau phay, dau #, %, hoac emoji/ky tu unicode dac biet du da duoc
 * encodeURIComponent) - trinh duyet se tu luu file voi ten mong muon thong qua
 * thuoc tinh `download` cua the <a>, hoan toan tach biet khoi URL goc.
 *
 * Neu fetch/tao Blob that bai (vd mang cham, Cloudinary chan CORS...), se fallback
 * mo URL goc o tab moi de nguoi dung van tai duoc file (chi la ten file luc do
 * se do trinh duyet Cloudinary tu dat, khong dep bang nhung van tai duoc).
 */
export const downloadFileAsBlob = async (url, filename) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Tai file that bai (HTTP ${response.status})`);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

/**
 * Tach 1 dong trong order.deliveredFiles (dang "Ten SP - Ten file: https://...")
 * thanh { label, url }.
 *
 * LUU Y QUAN TRONG: KHONG duoc dung `lastIndexOf(':')` de tim diem tach, vi
 * ban than URL cung chua dau ':' (trong "https://"). Neu dung lastIndexOf(':'),
 * dau ':' cuoi cung tim duoc se nam trong "https:" thay vi dau ':' phan cach
 * that su, khien chuoi "https" bi dinh nham vao cuoi label -> khi label nay
 * duoc dua vao fl_attachment (toCloudinaryDownloadUrl) se tao ra URL Cloudinary
 * sai cau truc (thua 1 doan "https" giua duong dan) -> Cloudinary tra ve loi
 * 400 khi tai file, hoac tai nham/khong dung file.
 *
 * Cach sua: dung regex tim dau ": " ngay TRUOC "http(s)://" (voi .* tham lam
 * o dau, no se tu dong lui ve dau ':' cuoi cung dung ngay truoc "http"),
 * dam bao tach dung ke ca khi ten san pham/ten file co chua dau ':'.
 */
export const parseDeliveredLink = (link) => {
  if (!link) return { label: '', url: '' };

  const match = String(link).match(/^(.*):\s*(https?:\/\/.+)$/s);
  if (match) {
    return { label: match[1].trim(), url: match[2].trim() };
  }

  // Khong khop dinh dang "label: url" -> coi ca chuoi la url neu co "http",
  // nguoc lai coi la label (fallback an toan, khong lam vo giao dien).
  if (link.includes('http')) {
    return { label: link.slice(0, link.indexOf('http')).trim(), url: link.slice(link.indexOf('http')) };
  }
  return { label: link, url: link };
};

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
