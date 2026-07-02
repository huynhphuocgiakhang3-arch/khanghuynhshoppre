'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Chào mừng trở lại, ${user.username}!`);
      router.push(user.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-mist-300 mb-1.5">Email hoặc tên đăng nhập</label>
        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="text"
            name="emailOrUsername"
            value={form.emailOrUsername}
            onChange={handleChange}
            required
            className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
            placeholder="ban@email.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-mist-300">Mật khẩu</label>
          <Link href="/auth/forgot-password" className="text-xs text-ember-400 hover:text-ember-300">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
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
        {isSubmitting ? <FiLoader className="animate-spin" /> : 'Đăng nhập'}
      </button>

      <p className="text-center text-sm text-mist-400">
        Chưa có tài khoản?{' '}
        <Link href="/auth/register" className="text-ember-400 hover:text-ember-300 font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
