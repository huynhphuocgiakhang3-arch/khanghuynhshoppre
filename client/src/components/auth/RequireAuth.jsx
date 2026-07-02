'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';

/**
 * Bao ve mot trang chi danh cho nguoi dung da dang nhap.
 * Neu chua dang nhap, tu dong redirect sang trang login.
 */
export default function RequireAuth({ children, adminOnly = false }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (adminOnly && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, adminOnly, router]);

  if (isLoading || !isAuthenticated || (adminOnly && user?.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="animate-spin text-2xl text-ember-500" />
      </div>
    );
  }

  return children;
}
