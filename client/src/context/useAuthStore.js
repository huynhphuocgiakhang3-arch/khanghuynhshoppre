'use client';

import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '../lib/api';

/**
 * Store toan cuc quan ly thong tin user dang dang nhap, dung Zustand
 * thay vi Context API thuan de tranh re-render khong can thiet.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  /** Goi khi app khoi dong de kiem tra session hien tai (tu cookie) */
  initAuth: async () => {
    const token = Cookies.get('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /** Dang nhap, luu token vao cookie va user vao store */
  login: async ({ emailOrUsername, password }) => {
    const { data } = await api.post('/auth/login', { emailOrUsername, password });
    const { user, accessToken, refreshToken } = data.data;

    Cookies.set('accessToken', accessToken, { expires: 7 });
    Cookies.set('refreshToken', refreshToken, { expires: 30 });

    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  /** Dang ky tai khoan moi */
  register: async ({ username, email, password, fullName }) => {
    const { data } = await api.post('/auth/register', { username, email, password, fullName });
    const { user, accessToken, refreshToken } = data.data;

    Cookies.set('accessToken', accessToken, { expires: 7 });
    Cookies.set('refreshToken', refreshToken, { expires: 30 });

    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  /** Dang xuat, xoa toan bo token va state */
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  /** Cap nhat lai thong tin user trong store (vi du sau khi nap tien) */
  refreshUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user });
      return data.data.user;
    } catch (error) {
      return get().user;
    }
  },

  /** Cap nhat balance ngay tren client ma khong can goi lai toan bo /me */
  setBalance: (newBalance) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, balance: newBalance } });
    }
  },
}));
