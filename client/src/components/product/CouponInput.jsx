'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiTag, FiLoader, FiCheckCircle, FiX } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

/**
 * O nhap ma giam gia kieu "premium" - vien gradient sang trong, hieu ung
 * khi ap dung thanh cong. Tu validate qua API truoc (khong doi den luc bam
 * mua moi biet ma co dung hay khong), sau khi ap dung thanh cong se bao ve
 * cha (onApplied) so tien duoc giam de cap nhat lai tong tien hien thi.
 */
export default function CouponInput({ productId, quantity = 1, variantName, onApplied, onRemoved }) {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [applied, setApplied] = useState(null); // { code, name, discountAmount }

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsChecking(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: code.trim(),
        items: [{ productId, quantity, ...(variantName && { variantName }) }],
      });
      setApplied(data.data);
      onApplied?.(data.data);
      toast.success(`Đã áp dụng mã, giảm ${formatVND(data.data.discountAmount)}!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    onRemoved?.();
  };

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 flex items-center gap-3"
          >
            <FiCheckCircle className="text-green-400 shrink-0" size={18} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-300 font-mono tracking-wide">{applied.code}</p>
              <p className="text-xs text-mist-400">Đã giảm {formatVND(applied.discountAmount)}</p>
            </div>
            <button type="button" onClick={handleRemove} className="text-mist-400 hover:text-mist-200 shrink-0">
              <FiX size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="input"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleApply}
            className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-ember-500/60 via-gold-500/50 to-ember-500/60"
          >
            <div className="flex items-center gap-2 rounded-[10px] bg-ink-900 pl-3.5 pr-1.5 py-1.5">
              <FiTag className="text-ember-400 shrink-0" size={16} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá..."
                className="flex-1 min-w-0 bg-transparent text-sm text-mist-100 placeholder:text-mist-500 py-1.5 font-mono tracking-wide focus:outline-none"
              />
              <button
                type="submit"
                disabled={isChecking || !code.trim()}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-ember-gradient px-3.5 py-2 text-xs font-semibold text-ink-950 disabled:opacity-40 transition-opacity"
              >
                {isChecking ? <FiLoader className="animate-spin" size={13} /> : 'Áp dụng'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
