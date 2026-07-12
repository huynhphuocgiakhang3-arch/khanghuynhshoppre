'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiX, FiCheck } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

export default function CouponFormModal({ coupon, onClose, onSaved }) {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [form, setForm] = useState({
    code: coupon?.code || '',
    name: coupon?.name || '',
    discountAmount: coupon?.discountAmount || '',
    applyToAll: coupon?.applyToAll ?? true,
    applicableProducts: coupon?.applicableProducts?.map((p) => (typeof p === 'string' ? p : p._id)) || [],
    isActive: coupon?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/admin/products', { params: { limit: 200 } })
      .then(({ data }) => setProducts(data.data))
      .catch(() => setProducts([]))
      .finally(() => setIsLoadingProducts(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleProduct = (id) => {
    setForm((prev) => ({
      ...prev,
      applicableProducts: prev.applicableProducts.includes(id)
        ? prev.applicableProducts.filter((x) => x !== id)
        : [...prev.applicableProducts, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.code.trim() || !form.name.trim() || !form.discountAmount) {
      toast.error('Vui lòng nhập đầy đủ mã, tên và số tiền giảm.');
      return;
    }
    if (!form.applyToAll && form.applicableProducts.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm áp dụng, hoặc bật "Áp dụng cho tất cả".');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        discountAmount: Number(form.discountAmount),
        applyToAll: form.applyToAll,
        applicableProducts: form.applyToAll ? [] : form.applicableProducts,
        isActive: form.isActive,
      };

      if (coupon) {
        await api.put(`/admin/coupons/${coupon._id}`, payload);
        toast.success('Đã cập nhật mã giảm giá.');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Đã tạo mã giảm giá mới.');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-mist-100">{coupon ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h2>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-200">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Mã giảm giá</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="VD: KHAITRUONG20"
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 font-mono uppercase tracking-wide"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Số tiền giảm (VND)</label>
              <input
                type="number"
                name="discountAmount"
                value={form.discountAmount}
                onChange={handleChange}
                placeholder="VD: 20000"
                min={1000}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Tên gợi nhớ (chỉ Admin thấy)</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="VD: Giảm giá mừng khai trương"
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-mist-300">
            <input type="checkbox" name="applyToAll" checked={form.applyToAll} onChange={handleChange} className="rounded accent-ember-500" />
            Áp dụng cho tất cả sản phẩm
          </label>

          {!form.applyToAll && (
            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">
                Chọn sản phẩm áp dụng ({form.applicableProducts.length} đã chọn)
              </label>
              {isLoadingProducts ? (
                <p className="text-xs text-mist-500">Đang tải danh sách sản phẩm...</p>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-ink-600 divide-y divide-ink-700">
                  {products.map((p) => {
                    const checked = form.applicableProducts.includes(p._id);
                    return (
                      <button
                        type="button"
                        key={p._id}
                        onClick={() => toggleProduct(p._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                          checked ? 'bg-ember-500/10 text-mist-100' : 'text-mist-400 hover:bg-ink-800'
                        }`}
                      >
                        <span
                          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                            checked ? 'bg-ember-gradient border-transparent' : 'border-ink-500'
                          }`}
                        >
                          {checked && <FiCheck size={11} className="text-ink-950" />}
                        </span>
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-xs text-mist-500 shrink-0">{formatVND(p.salePrice ?? p.price)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-mist-300">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded accent-ember-500" />
            Kích hoạt ngay (khách có thể dùng ngay sau khi tạo)
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-ink-600 py-2.5 text-sm font-medium text-mist-300">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : coupon ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
