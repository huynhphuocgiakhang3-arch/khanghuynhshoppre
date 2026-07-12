const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route POST /api/admin/upload/image
 * @desc Upload 1 anh (thumbnail san pham) len Cloudinary, tra ve url + publicId.
 *       Middleware uploadImage.single('file') da xu ly upload truoc khi vao day.
 */
const uploadProductImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Vui long chon anh de upload.', 400));
  }

  res.status(201).json({
    success: true,
    data: {
      url: req.file.path, // multer-storage-cloudinary tra url Cloudinary qua field path
      publicId: req.file.filename,
    },
  });
});

/**
 * @route POST /api/admin/upload/delivery-file
 * @desc Upload file giao cho khach (file game, key, config...) len Cloudinary.
 */
const uploadDeliveryFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Vui long chon file de upload.', 400));
  }

  res.status(201).json({
    success: true,
    data: {
      name: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
    },
  });
});

/**
 * @route DELETE /api/admin/upload
 * @desc Xoa 1 file tren Cloudinary theo publicId (dung khi Admin go anh/file cu).
 */
const deleteUploadedFile = catchAsync(async (req, res, next) => {
  const { publicId, resourceType } = req.body;
  if (!publicId) {
    return next(new AppError('Thieu publicId can xoa.', 400));
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: ['raw', 'video'].includes(resourceType) ? resourceType : 'image',
  });

  res.status(200).json({ success: true, message: 'Da xoa file.' });
});

/**
 * @route POST /api/admin/upload/video
 * @desc Upload video test/demo san pham len Cloudinary, tra ve url + publicId
 *       + thumbnail (poster) tu dong sinh tu frame dau cua video.
 *       Middleware uploadVideo.single('file') da xu ly upload truoc khi vao day.
 */
const uploadProductVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Vui long chon video de upload.', 400));
  }

  // Cloudinary cho phep sinh anh poster tu video bang cach doi duoi file
  // trong URL sang .jpg (chi mat 1 chi phi bien doi nho, khong can goi API rieng).
  const thumbnail = req.file.path.replace(/\.[^/.]+$/, '.jpg');

  res.status(201).json({
    success: true,
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      thumbnail,
    },
  });
});

module.exports = { uploadProductImage, uploadDeliveryFile, uploadProductVideo, deleteUploadedFile };
