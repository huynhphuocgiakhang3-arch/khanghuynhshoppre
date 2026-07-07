const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/** Tao slug tu ten danh muc, ho tro tieng Viet co dau */
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
 * @route GET /api/categories
 * @desc Danh sach danh muc public (chi lay danh muc dang active), dung cho
 *       trang san pham hien thi filter.
 */
const getActiveCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder name');
  res.status(200).json({ success: true, data: categories });
});

/**
 * @route GET /api/admin/categories
 * @desc Danh sach toan bo danh muc (gom ca inactive) cho Admin quan ly.
 */
const getAllCategoriesAdmin = catchAsync(async (req, res) => {
  const categories = await Category.find().sort('sortOrder name');
  res.status(200).json({ success: true, data: categories });
});

/**
 * @route POST /api/admin/categories
 */
const createCategory = catchAsync(async (req, res, next) => {
  const { name, description, sortOrder } = req.body;
  if (!name || !name.trim()) {
    return next(new AppError('Vui long nhap ten danh muc.', 400));
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;
  while (await Category.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const category = await Category.create({ name, slug, description, sortOrder });
  res.status(201).json({ success: true, data: category });
});

/**
 * @route PUT /api/admin/categories/:id
 */
const updateCategory = catchAsync(async (req, res, next) => {
  const { name, description, sortOrder, isActive } = req.body;
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Danh muc khong ton tai.', 404));

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  res.status(200).json({ success: true, data: category });
});

/**
 * @route DELETE /api/admin/categories/:id
 */
const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Danh muc khong ton tai.', 404));
  res.status(200).json({ success: true, message: 'Da xoa danh muc.' });
});

module.exports = {
  getActiveCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
