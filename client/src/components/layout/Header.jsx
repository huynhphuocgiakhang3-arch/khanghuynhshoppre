'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiLogOut, FiCreditCard, FiShoppingBag } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';
import { formatVND } from '../../lib/utils';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/contact', label: 'Liên hệ' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display font-extrabold text-xl tracking-tight bg-ember-gradient bg-clip-text text-transparent">
              Khanghuynh
            </span>
            <span className="font-display text-xs text-mist-400 tracking-widest uppercase">.shop</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-ember-400 ${
                  pathname === link.href ? 'text-ember-500' : 'text-mist-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: theme toggle + auth/user */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-full border border-ink-600 bg-ink-800 px-3 py-1.5 hover:border-ember-500/50 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-gradient text-xs font-bold text-ink-950">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="text-sm text-mist-100">{user?.username}</span>
                  <span className="text-xs text-gold-500 font-mono">{formatVND(user?.balance)}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-600 bg-ink-800 shadow-2xl overflow-hidden">
                    <Link
                      href="/wallet"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-mist-200 hover:bg-ink-700"
                    >
                      <FiCreditCard /> Ví của tôi
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-mist-200 hover:bg-ink-700"
                    >
                      <FiShoppingBag /> Đơn hàng của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gold-500 hover:bg-ink-700"
                      >
                        <FiUser /> Trang quản trị
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-ink-700 border-t border-ink-600"
                    >
                      <FiLogOut /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-sm font-medium text-mist-300 hover:text-white">
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full bg-ember-gradient px-4 py-2 text-sm font-semibold text-ink-950 shadow-ember hover:opacity-90 transition-opacity"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle + theme */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              className="text-mist-200 text-2xl"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Mở menu"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-ink-700 bg-ink-900 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block text-sm font-medium text-mist-200 py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-ink-700 pt-3">
            {isAuthenticated ? (
              <>
                <Link href="/wallet" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm text-mist-200">
                  Ví của tôi ({formatVND(user?.balance)})
                </Link>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm text-mist-200">
                  Đơn hàng của tôi
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm text-gold-500">
                    Trang quản trị
                  </Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-red-400">
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center rounded-full border border-ink-600 py-2 text-sm text-mist-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center rounded-full bg-ember-gradient py-2 text-sm font-semibold text-ink-950"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
