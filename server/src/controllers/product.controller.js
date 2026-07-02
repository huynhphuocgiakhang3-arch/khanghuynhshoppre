const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * Sinh slug tu ten san pham, dam bao KHONG BAO GIO tra ve chuoi rong.
 * Bug thuc te: neu ten san pham chi gom emoji/ky tu dac biet/font chu "cach
 * dieu" (vd "🔥🔥🔥", "!!!", chu Unicode toan ky tu ngoai a-z0-9), slugify()
 * se strip het con lai chuoi rong -> Mongo bao "Path `slug` is required."
 * khi tao san pham. Ham nay fallback sang "san-pham-<ma ngau nhien>" trong
 * truong hop do, dam bao luon tao san pham thanh cong.
 */
const buildSlug = (name) => {
  const base = slugify(name || '');
  if (base) return base;
  return `san-pham-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
};

const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/products
 * @desc Danh sach san pham public (co filter, search, pagination)
 */
const getProducts = catchAsync(async (req, res) => {
  const { category, search, page = 1, limit = 12, sort = '-createdAt', featured } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (search) filter.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @route GET /api/products/:slug
 */
const getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) return next(new AppError('San pham khong ton tai.', 404));
  res.status(200).json({ success: true, data: product });
});

/**
 * @route POST /api/admin/products
 */
const createProduct = catchAsync(async (req, res) => {
  const { name } = req.body;
  const baseSlug = buildSlug(name);

  let slug = baseSlug;
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const product = await Product.create({ ...req.body, slug });
  res.status(201).json({ success: true, data: product });
});

/**
 * @route PUT /api/admin/products/:id
 */
const updateProduct = catchAsync(async (req, res, next) => {
  // Khong cho phep client vo tinh gui slug rong de "de xoa" slug hien tai
  // (vi du form frontend gui thieu truong nay) - chi bo qua, giu nguyen slug cu.
  const body = { ...req.body };
  if (!body.slug) delete body.slug;

  const product = await Product.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!product) return next(new AppError('San pham khong ton tai.', 404));
  res.status(200).json({ success: true, data: product });
});

/**
 * @route DELETE /api/admin/products/:id
 */
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError('San pham khong ton tai.', 404));
  res.status(200).json({ success: true, message: 'Da xoa san pham.' });
});

/**
 * @route GET /api/admin/products (danh sach day du cho admin, gom inactive)
 */
const getAllProductsAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find().sort('-createdAt').skip(skip).limit(Number(limit)),
    Product.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};
