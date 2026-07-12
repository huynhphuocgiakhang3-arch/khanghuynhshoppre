'use client';

import { FiSun, FiMoon } from 'react-icons/fi';
import { useThemeStore } from '../../context/useThemeStore';

/**
 * Nut chuyen doi theme sang (mat troi) / toi (mat trang). Icon hien tai
 * the hien theme se chuyen TOI khi bam (giong UX cua phan lon website).
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-mist-300 hover:border-ember-500/50 hover:text-ember-400 transition-colors"
      title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Chuyển đổi giao diện sáng/tối"
    >
      {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  );
}
