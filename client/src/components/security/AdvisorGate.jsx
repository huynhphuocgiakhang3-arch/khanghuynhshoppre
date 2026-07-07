'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../context/useAuthStore';

/**
 * Dat o ROOT LAYOUT (ap dung cho TOAN BO site) - neu tai khoan dang dang
 * nhap co role 'advisor' (Co van), BAT BUOC chi duoc o trang /advisor, moi
 * URL khac (kể ca trang chu '/', trang san pham, gio hang...) deu tu dong
 * bi day ve lai /advisor NGAY LAP TUC - dung nhu yeu cau "chi co dung 1 o
 * tien va rut, cac chuc nang khac khong the dung duoc".
 *
 * Chay o CA client-side navigation LAN sau khi F5/tai lai trang (vi
 * useEffect nay chay lai moi khi pathname hoac user thay doi), nen ke ca
 * Admin vua cap quyen Co van xong, nguoi do F5 lai trang hien tai se duoc
 * tu dong dua ve dung /advisor ngay, khong can dang xuat/dang nhap lai.
 */
export default function AdvisorGate() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== 'advisor') return;

    if (!pathname.startsWith('/advisor')) {
      router.replace('/advisor');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  return null;
}
