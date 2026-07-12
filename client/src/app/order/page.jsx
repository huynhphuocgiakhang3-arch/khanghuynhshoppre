'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSmartphone, FiCheckSquare, FiSquare, FiShoppingCart, FiLoader, FiZap } from 'react-icons/fi';
import RequireAuth from '../../components/auth/RequireAuth';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';
import { useAuthStore } from '../../context/useAuthStore';

const DEVICES = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
];

export default function OrderPage() {
  return (
    <RequireAuth>
      <OrderContent />
    </RequireAuth>
  );
}

function OrderContent() {
  const { user, setBalance } = useAuthStore();
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [device, setDevice] = useState('ios');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/service-features')
      .then(({ data }) => setFeatures(data.data))
      .catch(() => setFeatures([]))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleFeature = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedFeatures = features.filter((f) => selectedIds.includes(f._id));
  const total = selectedFeatures.reduce((sum, f) => sum + f.price, 0);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 chức năng.');
      return;
    }
    if (user && user.balance < total) {
      toast.error('Số dư không đủ, vui lòng nạp thêm tiền.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/service-orders', { device, featureIds: selectedIds });
      toast.success(data.message || 'Đặt dịch vụ thành công!');
      setBalance(user.balance - total);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đặt dịch vụ thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 pb-32">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full border border-ember-500/30 bg-ember-500/10 px-4 py-1.5 text-xs font-medium text-ember-400 uppercase tracking-wider">
            Dịch vụ tuỳ chỉnh
          </span>
          <h1 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl text-mist-100">Đặt sản phẩm</h1>
          <p className="mt-2 text-mist-400 max-w-lg mx-auto">
            Chọn thiết bị và các chức năng bạn cần, hệ thống tự cộng giá — thanh toán trực tiếp từ số dư ví.
          </p>
        </div>

        {/* Chon thiet bi */}
        <div className="mb-8">
          <p className="text-sm font-medium text-mist-300 mb-3">Thiết bị của bạn</p>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {DEVICES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDevice(d.value)}
                className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-colors ${
                  device === d.value
                    ? 'border-ember-500 bg-ember-500/10 text-ember-400'
                    : 'border-ink-700 text-mist-300 hover:border-ink-500'
                }`}
              >
                <FiSmartphone /> {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chon chuc nang */}
        <div>
          <p className="text-sm font-medium text-mist-300 mb-3">Chọn chức năng (chọn được nhiều)</p>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-ink-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((f, idx) => {
                const isChecked = selectedIds.includes(f._id);
                return (
                  <motion.button
                    key={f._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => toggleFeature(f._id)}
                    className={`relative flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                      isChecked
                        ? 'border-ember-500/70 bg-ember-500/10 shadow-ember'
                        : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      {isChecked ? (
                        <FiCheckSquare className="text-ember-400 shrink-0" size={19} />
                      ) : (
                        <FiSquare className="text-mist-500 shrink-0" size={19} />
                      )}
                      <span className="text-sm font-medium text-mist-100 truncate">{f.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-gold-400">{formatVND(f.price)}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Thanh tong tien + nut dat, dinh o day man hinh de luon thay khi cuon */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-700 bg-ink-950/95 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-mist-500">Tổng cộng ({selectedIds.length} chức năng)</p>
            <p className="font-display font-bold text-xl text-gold-400">{formatVND(total)}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="flex items-center gap-2 rounded-full bg-ember-gradient px-6 py-3 font-semibold text-ink-950 shadow-ember disabled:opacity-40 transition-opacity"
          >
            {isSubmitting ? <FiLoader className="animate-spin" /> : <FiShoppingCart />}
            {isSubmitting ? 'Đang xử lý...' : 'Đặt ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
