const express = require('express');
const router = express.Router();

const { uploadImage, uploadDeliveryFile, uploadVideo } = require('../config/cloudinary');
const {
  uploadProductImage,
  uploadDeliveryFile: uploadDeliveryFileController,
  uploadProductVideo,
  deleteUploadedFile,
} = require('../controllers/upload.controller');

// Cac route nay duoc gan vao /api/admin/upload trong admin.routes.js,
// da duoc bao ve boi protect + adminOnly o muc do router cha.

router.post('/image', uploadImage.single('file'), uploadProductImage);
router.post('/delivery-file', uploadDeliveryFile.single('file'), uploadDeliveryFileController);
router.post('/video', uploadVideo.single('file'), uploadProductVideo);
router.delete('/', deleteUploadedFile);

module.exports = router;
