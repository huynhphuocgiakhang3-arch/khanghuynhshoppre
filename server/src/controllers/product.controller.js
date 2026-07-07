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
const { isVipUser, getVipItemPrice, VIP_ITEM_DISCOUNT_THRESHOLD } = require('../utils/pricing');

/**
 * Gan them thong tin gia VIP vao 1 san pham de hien thi (KHONG dung de tinh
 * tien that su - gia that luon duoc tinh lai o server khi tao don hang).
 * Neu san pham co variants: gan vipPrice cho tung variant + khoang vipPrice
 * min/max cua ca san pham. Neu khong: gan vipPrice cap goc san pham.
 * Tra ve null cho vipPrice neu khach khong phai VIP hoac san pham khong du
 * dieu kien (gia <= 50k) - de frontend de dang kiem tra `if (vipPrice)`.
 */
const decorateVipPricing = (productDoc, isVip) => {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    product.variants = product.variants.map((v) => {
      const base = v.salePrice ?? v.price;
      const vipPrice = getVipItemPrice(base, isVip);
      return { ...v, vipPrice: vipPrice < base ? vipPrice : null };
    });
  } else {
    const base = product.salePrice ?? product.price;
    const vipPrice = getVipItemPrice(base, isVip);
    product.vipPrice = vipPrice < base ? vipPrice : null;
  }

  return product;
};

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

  // San pham duoc Admin ghim luon hien truoc tien (moi ghim gan nhat len
  // dau), sau do moi ap dung sort binh thuong (mac dinh: moi nhat truoc).
  const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortDir = sort.startsWith('-') ? -1 : 1;
  const sortSpec = { isPinned: -1, pinnedAt: -1, [sortField]: sortDir };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  const isVip = isVipUser(req.user);
  const data = products.map((p) => decorateVipPricing(p, isVip));

  res.status(200).json({
    success: true,
    data,
    vipDiscountThreshold: VIP_ITEM_DISCOUNT_THRESHOLD,
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

  const isVip = isVipUser(req.user);
  const data = decorateVipPricing(product, isVip);

  res.status(200).json({ success: true, data });
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
    Product.find().sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route PATCH /api/admin/products/:id/pin
 * @desc Bat/tat ghim san pham (san pham ghim luon hien dau trang chu & trang san pham)
 */
const togglePinProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Khong tim thay san pham.', 404));

  product.isPinned = !product.isPinned;
  product.pinnedAt = product.isPinned ? new Date() : null;
  await product.save();

  res.status(200).json({ success: true, data: product });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  togglePinProduct,
};
