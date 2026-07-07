const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendOrderConfirmationEmail } = require('../services/mail.service');
const { notifyNewPurchase, notifyBalanceAnomaly } = require('../services/telegram.service');
const { isVipUser, getVipItemPrice } = require('../utils/pricing');
const { checkBalanceAnomaly } = require('../services/antiCrack.service');

/**
 * @route POST /api/orders
 * @desc Tao don hang moi, thanh toan bang vi (balance). Dung transaction
 *       MongoDB de dam bao tinh nhat quan (atomic) khi tru tien + tao don.
 *       items: [{ productId, quantity, variantName? }] - variantName chi can
 *       neu san pham co nhieu goi (variants), bo qua neu san pham 1 gia.
 */
const createOrder = catchAsync(async (req, res, next) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError('Don hang phai co it nhat 1 san pham.', 400));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).session(session);

    if (products.length !== productIds.length) {
      throw new AppError('Mot so san pham khong ton tai hoac da bi ngung ban.', 400);
    }

    const orderItems = [];
    let totalAmount = 0;
    const deliveredFiles = [];
    // Ghi nho can tru kho o dau: variant cu the hay san pham goc, de xu ly
    // dung cho ca 2 truong hop trong vong lap cap nhat stock ben duoi.
    const stockUpdates = [];

    // VIP guest: giam 50% cho moi san pham gia > 50.000d (xem utils/pricing.js).
    // Tinh o day (server), KHONG BAO GIO tin gia client gui len.
    const isVip = isVipUser(req.user);

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      const quantity = Number(item.quantity) || 1;
      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

      if (hasVariants) {
        if (!item.variantName) {
          throw new AppError(`Vui long chon goi cho san pham "${product.name}".`, 400);
        }

        const variant = product.variants.find((v) => v.name === item.variantName);
        if (!variant) {
          throw new AppError(`Goi "${item.variantName}" khong ton tai cho san pham "${product.name}".`, 400);
        }

        if (variant.stock < quantity) {
          throw new AppError(`Goi "${variant.name}" cua "${product.name}" khong du hang (con ${variant.stock}).`, 400);
        }

        const basePrice = variant.salePrice ?? variant.price;
        const finalPrice = getVipItemPrice(basePrice, isVip);
        orderItems.push({
          product: product._id,
          name: product.name,
          variantName: variant.name,
          price: finalPrice,
          quantity,
        });
        totalAmount += finalPrice * quantity;

        if (Array.isArray(variant.deliveryFiles) && variant.deliveryFiles.length > 0) {
          variant.deliveryFiles.forEach((file) => {
            deliveredFiles.push(`${product.name} (${variant.name}) - ${file.name || 'File'}: ${file.url}`);
          });
        }

        stockUpdates.push({ productId: product._id, variantName: variant.name, quantity });
      } else {
        if (product.stock < quantity) {
          throw new AppError(`San pham "${product.name}" khong du hang (con ${product.stock}).`, 400);
        }

        const basePrice = product.salePrice ?? product.price;
        const finalPrice = getVipItemPrice(basePrice, isVip);
        orderItems.push({ product: product._id, name: product.name, variantName: '', price: finalPrice, quantity });
        totalAmount += finalPrice * quantity;

        if (Array.isArray(product.deliveryFiles) && product.deliveryFiles.length > 0) {
          product.deliveryFiles.forEach((file) => {
            deliveredFiles.push(`${product.name} - ${file.name || 'File'}: ${file.url}`);
          });
        }

        stockUpdates.push({ productId: product._id, variantName: null, quantity });
      }
    }

    // LUU Y: don hang mua trong shop CHI ap dung giam 50% tung san pham (da
    // tinh o tren qua getVipItemPrice), KHONG co giam them tren tong don -
    // khoan giam thang 50k chi danh rieng cho luong "Dat hang/Dat dich vu"
    // (xem serviceOrder.controller.js).
    const originalTotalAmount = totalAmount;
    const discountAmount = 0;

    const user = await User.findById(req.user._id).session(session);
    if (user.balance < totalAmount) {
      throw new AppError('So du vi khong du. Vui long nap them tien.', 400);
    }

    const balanceBefore = user.balance;
    user.balance -= totalAmount;
    await user.save({ session });

    const order = await Order.create([
      {
        user: user._id,
        items: orderItems,
        totalAmount,
        originalTotalAmount,
        vipDiscountAmount: discountAmount,
        status: 'paid',
        paymentMethod: 'wallet',
        deliveredFiles,
      },
    ], { session });

    const createdOrder = order[0];

    await Transaction.create([
      {
        user: user._id,
        type: 'purchase',
        amount: -totalAmount,
        balanceBefore,
        balanceAfter: user.balance,
        status: 'success',
        method: 'manual',
        relatedOrder: createdOrder._id,
        transferContent: createdOrder.orderCode,
      },
    ], { session });

    // Cap nhat stock & soldCount: tru dung kho cua variant neu co, hoac kho
    // goc neu san pham khong dung variants.
    for (const update of stockUpdates) {
      if (update.variantName) {
        await Product.updateOne(
          { _id: update.productId, 'variants.name': update.variantName },
          { $inc: { 'variants.$.stock': -update.quantity, soldCount: update.quantity } },
          { session }
        );
      } else {
        await Product.updateOne(
          { _id: update.productId },
          { $inc: { stock: -update.quantity, soldCount: update.quantity } },
          { session }
        );
      }
    }

    await session.commitTransaction();

    sendOrderConfirmationEmail(user, createdOrder).catch(() => {});
    notifyNewPurchase(createdOrder, user, { isVip, discountAmount }).catch(() => {});
    checkBalanceAnomaly(user, balanceBefore, user.balance, 'purchase').catch(() => {});

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    await session.abortTransaction();
    return next(error instanceof AppError ? error : new AppError(error.message, 500));
  } finally {
    session.endSession();
  }
});

/**
 * @route GET /api/orders/my-orders
 */
const getMyOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route GET /api/orders/:id
 */
const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return next(new AppError('Don hang khong ton tai.', 404));
  res.status(200).json({ success: true, data: order });
});

/**
 * @route GET /api/admin/orders (Admin xem tat ca don hang)
 */
const getAllOrdersAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'username email').sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrdersAdmin };
