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
 */
const deliveryFileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'khanghuynh-shop/products/delivery-files',
    resource_type: 'raw',
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
