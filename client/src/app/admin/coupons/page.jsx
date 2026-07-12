'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import CouponFormModal from '../../../components/admin/CouponFormModal';
import api from '../../../lib/api';
import { formatVND } from '../../../lib/utils';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/coupons');
      setCoupons(data.data);
    } catch (error) {
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (coupon) => {
    if (!confirm(`Xóa mã giảm giá "${coupon.code}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/coupons/${coupon._id}`);
      toast.success('Đã xóa mã giảm giá.');
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Đã tạm dừng mã.' : 'Đã kích hoạt lại mã.');
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-mist-100">Mã giảm giá</h1>
          <p className="text-sm text-mist-400 mt-1">Tạo mã giảm giá theo số tiền cố định, áp dụng cho 1 phần hoặc toàn bộ sản phẩm.</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-ember-gradient px-4 py-2.5 text-sm font-semibold text-ink-950"
        >
          <FiPlus /> Tạo mã mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-mist-500">Đang tải...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-mist-500 border border-dashed border-ink-700 rounded-2xl">
          <FiTag className="mx-auto mb-3 opacity-40" size={32} />
          Chưa có mã giảm giá nào. Bấm "Tạo mã mới" để bắt đầu.
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => (
            <div
              key={coupon._id}
              className={`glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${
                !coupon.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-ember-400 text-lg tracking-wide">{coupon.code}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      coupon.isActive ? 'border-green-500/40 text-green-300 bg-green-500/10' : 'border-ink-600 text-mist-500'
                    }`}
                  >
                    {coupon.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
                <p className="text-sm text-mist-300 mt-1">{coupon.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-mist-500">
                  <span>
                    Giảm: <span className="text-gold-400 font-semibold">{formatVND(coupon.discountAmount)}</span>
                  </span>
                  <span>
                    Áp dụng:{' '}
                    <span className="text-mist-300">
                      {coupon.applyToAll ? 'Tất cả sản phẩm' : `${coupon.applicableProducts?.length || 0} sản phẩm cụ thể`}
                    </span>
                  </span>
                  <span>
                    Đã dùng: <span className="text-mist-300">{coupon.usedCount || 0} lần</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(coupon)}
                  className="p-2 rounded-lg text-mist-400 hover:text-mist-200 hover:bg-ink-800"
                  title={coupon.isActive ? 'Tạm dừng mã' : 'Kích hoạt lại'}
                >
                  {coupon.isActive ? <FiToggleRight size={20} className="text-green-400" /> : <FiToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setShowModal(true);
                  }}
                  className="p-2 rounded-lg text-mist-400 hover:text-mist-200 hover:bg-ink-800"
                >
                  <FiEdit2 size={16} />
                </button>
                <button onClick={() => handleDelete(coupon)} className="p-2 rounded-lg text-mist-400 hover:text-red-400 hover:bg-ink-800">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            fetchCoupons();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
