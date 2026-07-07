'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiHome, FiCreditCard, FiClock, FiShoppingBag, FiMessageCircle, FiX } from 'react-icons/fi';

const DRAWER_LINKS = [
  { href: '/', label: 'Trang chủ', icon: FiHome },
  { href: '/wallet', label: 'Nạp tiền', icon: FiCreditCard },
  { href: '/wallet/history', label: 'Lịch sử giao dịch', icon: FiClock },
  { href: '/order', label: 'Đặt sản phẩm', icon: FiShoppingBag },
  { href: '/contact', label: 'Liên hệ', icon: FiMessageCircle },
];

/**
 * Drawer dieu huong chinh, truot ra tu ben TRAI, dung chung cho ca mobile va
 * desktop (thay the hoan toan thanh nav ngang cu). Mo bang nut hamburger o
 * goc trai Header.
 */
export default function NavDrawer({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-ink-950/80 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-[95] w-72 max-w-[80vw] bg-ink-900 border-r border-ink-700 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink-700/80">
              <span className="font-display font-extrabold text-lg bg-ember-gradient bg-clip-text text-transparent">
                Khang Huỳnh Shop
              </span>
              <button onClick={onClose} aria-label="Đóng menu" className="text-mist-400 hover:text-mist-100">
                <FiX size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {DRAWER_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ember-gradient text-ink-950'
                        : 'text-mist-300 hover:bg-ink-800 hover:text-mist-100'
                    }`}
                  >
                    <Icon size={17} /> {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
