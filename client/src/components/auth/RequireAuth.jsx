'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';
import { useAuthStore } from '../../context/useAuthStore';

/**
 * Bao ve mot trang chi danh cho nguoi dung da dang nhap.
 * Neu chua dang nhap, tu dong redirect sang trang login.
 */
export default function RequireAuth({ children, adminOnly = false, requiredRole = null }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const roleToCheck = adminOnly ? 'admin' : requiredRole;
  const isRoleMismatch = roleToCheck && user?.role !== roleToCheck;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (isRoleMismatch) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, isRoleMismatch, router]);

  if (isLoading || !isAuthenticated || isRoleMismatch) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="animate-spin text-2xl text-ember-500" />
      </div>
    );
  }

  return children;
}
