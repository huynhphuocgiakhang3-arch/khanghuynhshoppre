'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

// Cac muc nhanh thuong dung - bam 1 phat la dien luon so tien, khong can go
// tay tung so 0, giam han rui ro go nham/go thua so 0.
const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function AdjustBalanceModal({ user, onClose, onSaved }) {
  // THIET KE MOI: tach rieng "huong" (cong/tru) va "so tien" (luon la so
  // duong) thay vi bat nguoi dung tu go dau am/duong truoc con so - day la
  // nguyen nhan chinh gay nham lan/loi truoc kia (go quen dau "-", hoac go
  // du dau nhung lai bam nham). Gio chi can bam chon "Cộng tiền" hoac "Trừ
  // tiền" roi nhap 1 so duong don gian.
  const [direction, setDirection] = useState('add'); // 'add' | 'subtract'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = Math.abs(Number(amount) || 0);
  const previewBalance = direction === 'add' ? user.balance + numericAmount : user.balance - numericAmount;
  const willGoNegative = direction === 'subtract' && previewBalance < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!numericAmount) {
      toast.error('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (willGoNegative) {
      toast.error('Số dư sau khi trừ sẽ bị âm - vui lòng kiểm tra lại số tiền.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/admin/users/${user._id}/balance`, { direction, amount: numericAmount, note });
      toast.success(direction === 'add' ? 'Đã cộng tiền vào ví.' : 'Đã trừ tiền khỏi ví.');
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
          <h2 className="font-display font-bold text-lg text-mist-100">Điều chỉnh số dư ví</h2>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-200">
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-mist-400 mb-1">
          Tài khoản: <span className="text-mist-100 font-medium">{user.username}</span>
        </p>
        <p className="text-sm text-mist-400 mb-5">
          Số dư hiện tại: <span className="text-gold-500 font-semibold">{formatVND(user.balance)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chon HUONG thao tac truoc tien - to, ro rang, khong the bam nham */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection('add')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                direction === 'add'
                  ? 'border-green-500 bg-green-500/15 text-green-300'
                  : 'border-ink-600 text-mist-400 hover:border-green-500/40'
              }`}
            >
              <FiPlus /> Cộng tiền
            </button>
            <button
              type="button"
              onClick={() => setDirection('subtract')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                direction === 'subtract'
                  ? 'border-red-500 bg-red-500/15 text-red-300'
                  : 'border-ink-600 text-mist-400 hover:border-red-500/40'
              }`}
            >
              <FiMinus /> Trừ tiền
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Số tiền (VND)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 50000"
              min={0}
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="text-xs px-2.5 py-1 rounded-lg border border-ink-600 text-mist-400 hover:border-ember-500/50 hover:text-mist-200"
                >
                  {formatVND(v)}
                </button>
              ))}
            </div>
          </div>

          {numericAmount > 0 && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-sm ${
                willGoNegative ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-ink-600 bg-ink-900/40 text-mist-300'
              }`}
            >
              Số dư sau khi {direction === 'add' ? 'cộng' : 'trừ'}:{' '}
              <span className="font-semibold text-mist-100">{formatVND(previewBalance)}</span>
              {willGoNegative && <span className="block mt-1 text-xs">⚠️ Số dư hiện tại không đủ để trừ số tiền này.</span>}
            </div>
          )}

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
              disabled={isSubmitting || willGoNegative}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50 ${
                direction === 'add' ? 'bg-ember-gradient' : 'bg-red-500'
              }`}
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : direction === 'add' ? 'Xác nhận cộng tiền' : 'Xác nhận trừ tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
