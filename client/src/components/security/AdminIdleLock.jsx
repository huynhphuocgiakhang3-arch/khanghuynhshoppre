'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiLock, FiLoader } from 'react-icons/fi';
import api from '../../lib/api';

const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 phut khong thao tac gi -> tu khoa man hinh
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

/**
 * Khoa man hinh trang admin sau 5 PHUT KHONG THAO TAC GI (di chuot, go phim,
 * cham man hinh, cuon trang...) - yeu cau nhap lai DUNG ma PIN bao mat de
 * tiep tuc, KHONG dang xuat/mat phien lam viec (chi la 1 lop man hinh khoa
 * phu tren cung, giong cach khoa man hinh dien thoai).
 *
 * Dat o admin/layout.jsx nen ap dung cho TOAN BO trang admin, khong anh
 * huong gi den cac tai khoan/trang khac (User/VIP/Co van deu khong bi khoa
 * kieu nay).
 */
export default function AdminIdleLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      if (!isLocked && Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
        setIsLocked(true);
      }
    }, 5000); // Kiem tra moi 5s la du, khong can lien tuc

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearInterval(checkInterval);
    };
  }, [isLocked]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    try {
      await api.post('/admin/verify-idle-pin', { pin });
      setIsLocked(false);
      setPin('');
      lastActivityRef.current = Date.now();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã PIN không đúng.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-950/95 backdrop-blur-xl">
      <form onSubmit={handleUnlock} className="w-full max-w-sm mx-4 rounded-2xl border border-ink-700 bg-ink-900/80 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-ember-500/10 border border-ember-500/30 flex items-center justify-center mb-3">
            <FiLock className="text-ember-400" size={24} />
          </div>
          <h2 className="font-display font-bold text-lg text-mist-100">Phiên làm việc đã tạm khóa</h2>
          <p className="text-sm text-mist-400 mt-1">Bạn đã rời khỏi trang quá 5 phút. Nhập mã PIN để tiếp tục.</p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-xl glass-input px-4 py-3 text-sm text-mist-100 text-center tracking-widest mb-4"
          placeholder="Nhập mã PIN bảo mật..."
        />

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
        >
          {isVerifying ? <FiLoader className="animate-spin" /> : 'Mở khóa'}
        </button>
      </form>
    </div>
  );
}
