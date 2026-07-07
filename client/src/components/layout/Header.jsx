'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiMenu, FiUser, FiLogOut, FiCreditCard, FiShoppingBag } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';
import { formatVND } from '../../lib/utils';
import ThemeToggle from './ThemeToggle';
import NavDrawer from './NavDrawer';

/**
 * Header rut gon: hamburger o goc TRAI (mo NavDrawer, dung chung cho ca
 * mobile & desktop thay vi 2 he thong nav rieng nhu truoc), logo o giua-trai,
 * nut Dang nhap/avatar LUON hien co dinh o goc PHAI cho moi kich thuoc man hinh.
 */
export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Trai: hamburger + logo */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Mở menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 text-mist-200 hover:border-ember-500/50 hover:text-ember-400 transition-colors"
            >
              <FiMenu size={19} />
            </button>

            <Link href="/" className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight bg-ember-gradient bg-clip-text text-transparent whitespace-nowrap">
                Khang Huỳnh
              </span>
              <span className="font-display text-[11px] sm:text-xs text-gold-400 tracking-[0.2em] uppercase whitespace-nowrap">
                Shop
              </span>
            </Link>
          </div>

          {/* Phai: theme toggle + dang nhap/avatar - LUON hien, moi kich thuoc man hinh */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 sm:gap-3 rounded-full border border-ink-600 bg-ink-800 px-2.5 sm:px-3 py-1.5 hover:border-ember-500/50 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember-gradient text-xs font-bold text-ink-950 shrink-0">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="hidden sm:inline text-sm text-mist-100">{user?.username}</span>
                  <span className="hidden sm:inline text-xs text-gold-500 font-mono">{formatVND(user?.balance)}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-600 bg-ink-800 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-ink-700 sm:hidden">
                      <p className="text-sm text-mist-100">{user?.username}</p>
                      <p className="text-xs text-gold-500 font-mono">{formatVND(user?.balance)}</p>
                    </div>
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
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/auth/login"
                  className="text-xs sm:text-sm font-medium text-mist-300 hover:text-white whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full bg-ember-gradient px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-ink-950 shadow-ember hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <NavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </header>
  );
}
