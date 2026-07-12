const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Tong hop thong ke tong quan cho trang Dashboard cua Admin.
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidOrdersAgg,
    todayOrdersAgg,
    monthOrdersAgg,
    pendingDeposits,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
    Order.find().populate('user', 'username email').sort('-createdAt').limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: paidOrdersAgg[0]?.total || 0,
      totalPaidOrders: paidOrdersAgg[0]?.count || 0,
      todayRevenue: todayOrdersAgg[0]?.total || 0,
      todayOrders: todayOrdersAgg[0]?.count || 0,
      monthRevenue: monthOrdersAgg[0]?.total || 0,
      monthOrders: monthOrdersAgg[0]?.count || 0,
      pendingDeposits,
      recentOrders,
    },
  });
});

/**
 * @route GET /api/admin/dashboard/revenue-chart
 * @desc Du lieu doanh thu theo ngay trong N ngay gan nhat, dung de ve chart.
 */
const getRevenueChart = catchAsync(async (req, res) => {
  const days = Number(req.query.days) || 14;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);

  const data = await Order.aggregate([
    { $match: { status: 'paid', createdAt: { $gte: fromDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({ success: true, data });
});

module.exports = { getDashboardStats, getRevenueChart };
