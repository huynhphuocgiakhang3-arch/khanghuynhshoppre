'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiLoader, FiCheck, FiX } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';

const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'Tối thiểu 8 ký tự' },
  { test: (v) => /[A-Z]/.test(v), label: 'Có ít nhất 1 chữ hoa' },
  { test: (v) => /[a-z]/.test(v), label: 'Có ít nhất 1 chữ thường' },
  { test: (v) => /\d/.test(v), label: 'Có ít nhất 1 số' },
];

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const isUsernameValid = USERNAME_REGEX.test(form.username);
  const isEmailValid = EMAIL_REGEX.test(form.email);
  const isPasswordValid = PASSWORD_RULES.every((rule) => rule.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
      setTouched({ username: true, email: true, password: true });
      toast.error('Vui lòng kiểm tra lại thông tin đăng ký.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register(form);
      toast.success(`Đăng ký thành công! Chào mừng ${user.username}.`);
      router.push('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-mist-300 mb-1.5">Tên đăng nhập</label>
        <div className="relative">
          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
            placeholder="khanghuynh_99"
          />
        </div>
        {touched.username && !isUsernameValid && (
          <p className="mt-1.5 text-xs text-red-400">4-32 ký tự, chỉ gồm chữ, số và gạch dưới.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-mist-300 mb-1.5">Email</label>
        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
            placeholder="ban@email.com"
          />
        </div>
        {touched.email && !isEmailValid && <p className="mt-1.5 text-xs text-red-400">Email không hợp lệ.</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-mist-300 mb-1.5">Mật khẩu</label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
            placeholder="••••••••"
          />
        </div>
        {touched.password && (
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(form.password);
              return (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-400' : 'text-mist-500'}`}>
                  {passed ? <FiCheck size={12} /> : <FiX size={12} />} {rule.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSubmitting ? <FiLoader className="animate-spin" /> : 'Tạo tài khoản'}
      </button>

      <p className="text-center text-sm text-mist-400">
        Đã có tài khoản?{' '}
        <Link href="/auth/login" className="text-ember-400 hover:text-ember-300 font-medium">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
