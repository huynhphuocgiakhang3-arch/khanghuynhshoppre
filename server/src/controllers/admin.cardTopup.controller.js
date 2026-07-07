const CardTopup = require('../models/CardTopup');
const catchAsync = require('../utils/catchAsync');
const { approveCardTopupById, rejectCardTopupById } = require('../services/cardTopupApproval.service');

/**
 * @route GET /api/admin/card-topups
 * @desc Danh sach the cao khach gui, loc theo trang thai (mac dinh: pending truoc)
 */
const getAllCardTopups = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    CardTopup.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'username email')
      .populate('processedBy', 'username'),
    CardTopup.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * @route PATCH /api/admin/card-topups/:id/approve
 * @desc Duyet the hop le: cong so du user dung bang menh gia the, tao
 *       Transaction (method='card') de doi soat, danh dau da xu ly.
 *       Logic thuc su nam o services/cardTopupApproval.service.js (dung
 *       chung voi nut bam duyet ngay tren Telegram).
 */
const approveCardTopup = catchAsync(async (req, res) => {
  const { cardTopup } = await approveCardTopupById(req.params.id, req.user.username, req.user._id);
  res.status(200).json({ success: true, data: cardTopup });
});

/**
 * @route PATCH /api/admin/card-topups/:id/reject
 * @desc Tu choi the sai/da su dung: khong cong tien, ghi ly do neu co.
 */
const rejectCardTopup = catchAsync(async (req, res) => {
  const { note } = req.body;
  const { cardTopup } = await rejectCardTopupById(req.params.id, req.user.username, note, req.user._id);
  res.status(200).json({ success: true, data: cardTopup });
});

module.exports = { getAllCardTopups, approveCardTopup, rejectCardTopup };
