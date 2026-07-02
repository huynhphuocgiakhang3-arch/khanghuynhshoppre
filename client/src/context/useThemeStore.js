'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';

/**
 * Store quan ly theme sang/toi cua website. Mac dinh la 'dark' (giu nguyen
 * giao dien goc), nguoi dung co the bam nut mat troi/mat trang de doi sang
 * theme sang, lua chon duoc luu vao cookie de nho cho lan ghe sau.
 */
export const useThemeStore = create((set, get) => ({
  theme: 'dark',

  /** Goi 1 lan khi app khoi dong de doc theme da luu (neu co) */
  initTheme: () => {
    const saved = Cookies.get('theme');
    const theme = saved === 'light' ? 'light' : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    Cookies.set('theme', newTheme, { expires: 365 });
    set({ theme: newTheme });
  },
}));
