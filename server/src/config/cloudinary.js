const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Storage dung cho anh san pham (thumbnail/images): luu duoi dang 'image',
 * Cloudinary se tu toi uu kich thuoc/chat luong.
 */
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'khanghuynh-shop/products/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

/**
 * Storage dung cho file giao cho khach sau khi mua (vd: file game, key, config...).
 * Dung resource_type 'raw' de Cloudinary chap nhan moi dinh dang file,
 * khong chi anh.
 *
 * QUAN TRONG: voi file 'raw', Cloudinary KHONG tach rieng "format" nhu anh/
 * video - duoi file phai nam ngay trong public_id, neu khong file se duoc
 * luu voi 1 chuoi ngau nhien KHONG co duoi (vd "gx2pk3jnsm2dglybnf3v"),
 * khien trinh duyet khong nhan dang duoc file khi tai ve. use_filename +
 * unique_filename dam bao Cloudinary tu lay ten + duoi file goc lam public_id
 * (kem hau to ngau nhien de tranh trung).
 */
const deliveryFileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Sanitize ten file truoc khi dua len Cloudinary lam public_id:
    // Cloudinary xu ly khong on dinh voi public_id chua emoji/ky tu unicode
    // dac biet (co the luu sai lech byte, gay loi khi doi chieu/tai file ve
    // sau nay). Ten file GOC (co emoji, tieng Viet co dau...) van duoc giu
    // nguyen ben "name" trong upload.controller.js (tra ve tu req.file.
    // originalname) de hien thi cho khach - chi phan luu tren Cloudinary la
    // duoc lam sach, khong anh huong ten hien thi.
    const lastDot = file.originalname.lastIndexOf('.');
    const ext = lastDot > -1 ? file.originalname.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const rawBase = lastDot > -1 ? file.originalname.slice(0, lastDot) : file.originalname;

    const safeBase = rawBase
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // bo dau tieng Viet (giu chu cai goc)
      .replace(/[^\w-]+/g, '_') // moi ky tu con lai khong phai chu/so -> "_", loai bo emoji
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 80) || 'file';

    return {
      folder: 'khanghuynh-shop/products/delivery-files',
      resource_type: 'raw',
      public_id: `${safeBase}-${Date.now()}`,
      format: ext || undefined,
    };
  },
});

/**
 * Storage dung cho video test/demo san pham. Dung resource_type 'video' de
 * Cloudinary encode/toi uu video, tu dong sinh thumbnail (poster) tu frame
 * dau video, phuc vu hien thi anh dai dien truoc khi bam play.
 */
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'khanghuynh-shop/products/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm', 'mkv'],
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // toi da 8MB cho anh
});

const uploadDeliveryFile = multer({
  storage: deliveryFileStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // toi da 50MB cho file giao hang
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // toi da 100MB cho video test
});

module.exports = { cloudinary, uploadImage, uploadDeliveryFile, uploadVideo };
