'use client';

import { useEffect, useState } from 'react';

/**
 * Lop "chong crack / chong sao chep" o muc do RAO CAN (deterrent), KHONG
 * PHAI bao mat tuyet doi - nguoi dung ranh trinh duyet van co the vo hieu
 * hoa (vd tat JS, dung extension rieng). Muc dich la gay kho khan cho da so
 * nguoi dung pho thong khi co gang F12/xem source/sao chep noi dung:
 *
 * - Chan menu chuot phai (contextmenu)
 * - Chan phim tat: F12, Ctrl+Shift+I/J/C, Ctrl+U (view-source), Ctrl+S (save)
 * - Phat hien DevTools dang mo bang cach so sanh kich thuoc outerWidth/
 *   outerHeight voi innerWidth/innerHeight (khi DevTools dock canh man hinh
 *   se lam lech so nay dang ke). Day la ky thuat heuristic don gian, co the
 *   bao sai tren mot so trinh duyet/thiet bi hiem gap - vi vay chi hien canh
 *   bao (khong khoa cung trang) va nguoi dung co the dong lai ngay.
 */
export default function AntiInspectGuard() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const blockContextMenu = (e) => e.preventDefault();

    const blockShortcuts = (e) => {
      const key = e.key?.toUpperCase();
      const blocked =
        key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
        (e.ctrlKey && key === 'U') ||
        (e.ctrlKey && key === 'S');
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);

    // Ky thuat 1: so le kich thuoc cua so (DevTools docked)
    const THRESHOLD = 160;
    const checkWindowSize = () => {
      // Bo qua tren man hinh nho (mobile) vi ban phim ao co the lam lech
      // innerHeight rat nhieu, gay canh bao gia
      if (window.innerWidth < 768) return;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
        setShowWarning(true);
      }
    };

    const sizeInterval = setInterval(checkWindowSize, 1000);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
      clearInterval(sizeInterval);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-950/95 backdrop-blur-lg p-6 text-center">
      <div className="max-w-sm">
        <p className="text-3xl mb-3">🔒</p>
        <h2 className="font-display font-bold text-lg text-mist-100 mb-2">
          Đã phát hiện công cụ kiểm tra (DevTools)
        </h2>
        <p className="text-sm text-mist-400 leading-relaxed">
          Vì lý do bảo vệ bản quyền nội dung, vui lòng đóng DevTools để tiếp tục sử dụng trang web.
        </p>
        <button
          onClick={() => setShowWarning(false)}
          className="mt-5 rounded-xl bg-ember-gradient px-6 py-2.5 text-sm font-semibold text-ink-950"
        >
          Đã hiểu, đóng lại
        </button>
      </div>
    </div>
  );
}
