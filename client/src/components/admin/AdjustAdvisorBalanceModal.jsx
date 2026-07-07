'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiX } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

export default function AdjustAdvisorBalanceModal({ user, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);

    if (!numericAmount) {
      toast.error('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    // amount am (tru) khong duoc lam so du hoa hong xuong duoi 0 -
    // server se tu dong chan (Math.max(0, ...)) nhung canh bao truoc cho ro.
    if (numericAmount < 0 && Math.abs(numericAmount) > user.advisorBalance) {
      if (!confirm(`Số tiền trừ (${formatVND(Math.abs(numericAmount))}) lớn hơn số dư hoa hồng hiện tại (${formatVND(user.advisorBalance)}). Số dư sẽ về 0. Tiếp tục?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/admin/users/${user._id}/advisor-balance`, { amount: numericAmount, note });
      toast.success(numericAmount > 0 ? 'Đã cộng hoa hồng.' : 'Đã trừ hoa hồng.');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-mist-100">Cộng / Trừ hoa hồng Cố vấn</h2>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-200">
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-mist-400 mb-1">
          Tài khoản: <span className="text-mist-100 font-medium">{user.username}</span>
        </p>
        <p className="text-sm text-mist-400 mb-5">
          Số dư hoa hồng hiện tại: <span className="text-cyan-300 font-semibold">{formatVND(user.advisorBalance)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">
              Số tiền (dương = cộng, âm = trừ)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 50000 hoặc -50000"
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount((v) => String(Math.abs(Number(v) || 0) || ''))}
                className="text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                Chuyển thành Cộng (+)
              </button>
              <button
                type="button"
                onClick={() => setAmount((v) => (Math.abs(Number(v) || 0) ? String(-Math.abs(Number(v))) : ''))}
                className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Chuyển thành Trừ (−)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do điều chỉnh..."
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-ink-600 py-2.5 text-sm font-medium text-mist-300">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
