'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiMail, FiLoader, FiArrowLeft } from 'react-icons/fi';
import api from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-8">
      <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-mist-400 hover:text-mist-200 mb-6">
        <FiArrowLeft /> Quay lại đăng nhập
      </Link>

      <h1 className="font-display font-bold text-2xl text-mist-100">Quên mật khẩu</h1>
      <p className="text-sm text-mist-400 mt-1 mb-6">
        Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      {isSent ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-sm text-green-300">
          Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút. Vui lòng kiểm tra cả hộp thư spam.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Email</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
                placeholder="ban@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? <FiLoader className="animate-spin" /> : 'Gửi hướng dẫn'}
          </button>
        </form>
      )}
    </div>
  );
}
