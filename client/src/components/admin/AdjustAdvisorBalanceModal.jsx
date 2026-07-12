'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function AdjustAdvisorBalanceModal({ user, onClose, onSaved }) {
  // Cung thiet ke voi AdjustBalanceModal: chon HUONG truoc (cong/tru), sau
  // do nhap 1 so tien duong don gian - khong con phai tu go dau +/- de
  // tranh nham lan. Rieng man hinh nay con them lua chon "Dat lai dung so
  // tien nay" cho truong hop can chinh ve 1 con so cu the (vd doi soat lai
  // sau khi phat hien sai lech), giu nguyen tinh nang nay tu ban cu.
  const [mode, setMode] = useState('adjust'); // 'adjust' | 'setExact'
  const [direction, setDirection] = useState('add');
  const [amount, setAmount] = useState('');
  const [exactAmount, setExactAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = Math.abs(Number(amount) || 0);
  const previewBalance =
    mode === 'setExact'
      ? Number(exactAmount) || 0
      : direction === 'add'
      ? user.advisorBalance + numericAmount
      : Math.max(0, user.advisorBalance - numericAmount);
  const willClampToZero = mode === 'adjust' && direction === 'subtract' && user.advisorBalance - numericAmount < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'setExact') {
      const exact = Number(exactAmount);
      if (exactAmount === '' || Number.isNaN(exact) || exact < 0) {
        toast.error('Vui lòng nhập số tiền hợp lệ.');
        return;
      }
    } else if (!numericAmount) {
      toast.error('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload =
        mode === 'setExact'
          ? { setExact: Number(exactAmount), note }
          : { direction, amount: numericAmount, note };
      await api.patch(`/admin/users/${user._id}/advisor-balance`, payload);
      toast.success(mode === 'setExact' ? 'Đã đặt lại số dư hoa hồng.' : direction === 'add' ? 'Đã cộng hoa hồng.' : 'Đã trừ hoa hồng.');
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

        <div className="flex rounded-xl border border-ink-600 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode('adjust')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'adjust' ? 'bg-ember-500/15 text-ember-300' : 'text-mist-400'
            }`}
          >
            Cộng / Trừ 1 khoản
          </button>
          <button
            type="button"
            onClick={() => setMode('setExact')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'setExact' ? 'bg-ember-500/15 text-ember-300' : 'text-mist-400'
            }`}
          >
            Đặt lại đúng số tiền
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'adjust' ? (
            <>
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
                  <FiPlus /> Cộng
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
                  <FiMinus /> Trừ
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
                <div className="rounded-xl border border-ink-600 bg-ink-900/40 px-4 py-2.5 text-sm text-mist-300">
                  Số dư sau khi {direction === 'add' ? 'cộng' : 'trừ'}:{' '}
                  <span className="font-semibold text-mist-100">{formatVND(previewBalance)}</span>
                  {willClampToZero && (
                    <span className="block mt-1 text-xs text-amber-300">
                      ⚠️ Số tiền trừ lớn hơn số dư hiện tại - hệ thống sẽ tự động đưa số dư về 0.
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Đặt số dư hoa hồng thành (VND)</label>
              <input
                type="number"
                value={exactAmount}
                onChange={(e) => setExactAmount(e.target.value)}
                placeholder="Ví dụ: 200000"
                min={0}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                required
              />
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
