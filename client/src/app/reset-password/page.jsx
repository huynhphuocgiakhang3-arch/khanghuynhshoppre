'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiLock, FiLoader } from 'react-icons/fi';
import api from '../../lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!token) {
      toast.error('Liên kết không hợp lệ hoặc đã hết hạn.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      router.push('/auth/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-radial-glow">
        <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
          <p className="text-mist-300">Liên kết đặt lại mật khẩu không hợp lệ.</p>
          <Link href="/auth/forgot-password" className="mt-4 inline-block text-ember-400 hover:text-ember-300">
            Yêu cầu lại liên kết mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-radial-glow">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md">
        <h1 className="font-display font-bold text-2xl text-mist-100">Đặt lại mật khẩu</h1>
        <p className="text-sm text-mist-400 mt-1 mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Xác nhận mật khẩu</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? <FiLoader className="animate-spin" /> : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * useSearchParams() yeu cau component cha phai duoc boc trong <Suspense>,
 * neu khong Next.js se loi khi prerender trang nay luc build production.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <FiLoader className="animate-spin text-2xl text-ember-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
