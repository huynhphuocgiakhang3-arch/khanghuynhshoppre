'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiGrid,
  FiBox,
  FiUsers,
  FiShoppingBag,
  FiSettings,
  FiArrowLeft,
  FiCreditCard,
  FiImage,
  FiSliders,
  FiTag,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: FiGrid },
  { href: '/admin/products', label: 'Sản phẩm', icon: FiBox },
  { href: '/admin/orders', label: 'Đơn hàng', icon: FiShoppingBag },
  { href: '/admin/coupons', label: 'Mã giảm giá', icon: FiTag },
  { href: '/admin/services', label: 'Đặt sản phẩm', icon: FiSliders },
  { href: '/admin/deposits', label: 'Duyệt nạp QR', icon: FiImage },
  { href: '/admin/card-topups', label: 'Duyệt thẻ cào', icon: FiCreditCard },
  { href: '/admin/users', label: 'Người dùng', icon: FiUsers },
  { href: '/admin/settings', label: 'Cấu hình', icon: FiSettings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full sm:w-64 shrink-0 border-r border-ink-700 bg-ink-900 min-h-screen sm:sticky sm:top-0">
      <div className="p-5 border-b border-ink-700">
        <span className="font-display font-extrabold text-lg bg-ember-gradient bg-clip-text text-transparent">
          Khanghuynh Admin
        </span>
      </div>

      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ember-gradient text-ink-950' : 'text-mist-300 hover:bg-ink-800'
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-4 border-t border-ink-700">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-mist-400 hover:bg-ink-800">
          <FiArrowLeft size={18} /> Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
