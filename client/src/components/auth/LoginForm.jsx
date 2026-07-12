'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLoader, FiShield } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const verifyAdminPin = useAuthStore((s) => s.verifyAdminPin);
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buoc 2 danh rieng cho Admin: sau khi mat khau dung, server yeu cau nhap
  // them ma PIN bao mat rieng (khong lien quan mat khau) truoc khi thuc su
  // dang nhap duoc - xem auth.controller.js/login.
  const [pendingToken, setPendingToken] = useState(null);
  const [pin, setPin] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Chào mừng trở lại, ${user.username}!`);
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'advisor') router.push('/advisor');
      else router.push('/');
    } catch (error) {
      if (error.pendingToken) {
        // Mat khau dung, nhung day la tai khoan Admin -> chuyen sang man
        // hinh nhap PIN bao mat thay vi bao loi.
        setPendingToken(error.pendingToken);
      } else {
        toast.error(error.response?.data?.message || 'Đăng nhập thất bại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error('Vui lòng nhập mã PIN bảo mật.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await verifyAdminPin({ pendingToken, pin });
      toast.success(`Chào mừng trở lại, ${user.username}!`);
      router.push('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã PIN không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- MAN HINH BUOC 2: nhap ma PIN bao mat (chi hien voi Admin) -----
  if (pendingToken) {
    return (
      <form onSubmit={handleVerifyPin} className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-ember-500/10 border border-ember-500/30 px-4 py-3">
          <FiShield className="text-ember-400 shrink-0" size={20} />
          <p className="text-sm text-mist-300">
            Mật khẩu chính xác. Vui lòng nhập <b className="text-mist-100">mã PIN bảo mật</b> để hoàn tất đăng nhập.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-mist-300 mb-1.5">Mã PIN bảo mật</label>
          <div className="relative">
            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100 tracking-widest"
              placeholder="Nhập mã số dài..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? <FiLoader className="animate-spin" /> : 'Xác nhận'}
        </button>

        <button
          type="button"
          onClick={() => {
            setPendingToken(null);
            setPin('');
          }}
          className="w-full text-center text-sm text-mist-400 hover:text-mist-200"
        >
          ← Quay lại đăng nhập
        </button>
      </form>
    );
  }

  // ----- MAN HINH BUOC 1: dang nhap binh thuong -----
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
