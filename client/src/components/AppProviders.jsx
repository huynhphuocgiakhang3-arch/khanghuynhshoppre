'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../context/useAuthStore';
import { useThemeStore } from '../context/useThemeStore';

export default function AppProviders({ children }) {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-ink-800)',
            color: 'var(--color-mist-100)',
            border: '1px solid var(--color-ink-600)',
          },
          success: { iconTheme: { primary: '#f5b942', secondary: '#0a0a0f' } },
          error: { iconTheme: { primary: '#ff5722', secondary: '#0a0a0f' } },
        }}
      />
    </>
  );
}
