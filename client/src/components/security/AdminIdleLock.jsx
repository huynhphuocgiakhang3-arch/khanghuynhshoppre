'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiLock, FiLoader } from 'react-icons/fi';
import api from '../../lib/api';

const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 phut khong thao tac gi -> tu khoa man hinh
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

// Khoa "cung" moi lan vao lai trang tu dau (dong/xoa tab, mo tab moi, hoac
// F5 SAU KHI da het han) duoc luu o sessionStorage - CHI ton tai trong dung
// 1 tab hien tai, tu dong mat khi dong/xoa tab. Nho vay:
//  - Dong tab roi mo lai / mo tab moi vao thang /admin -> khong con co nay
//    -> LUON bi khoa, bat buoc nhap lai ma.
//  - F5 (refresh) trong cung 1 tab, ma con han (chua qua 5 phut idle) ->
//    van giu duoc trang thai da mo khoa, khong hoi lai ma - dung y muon,
//    tranh gay phien khi Admin dang thao tac binh thuong ma lo F5.
const SESSION_UNLOCK_KEY = 'admin_idle_unlocked_session';
// Moc thoi gian hoat dong gan nhat - luu o localStorage (song sot qua F5 VA
// qua ca dong/mo tab) de dam bao: neu da qua 5 phut ke tu lan cuoi thao tac
// (bat ke co F5 hay khong), lan vao lai KE TIEP van phai bi khoa.
const LAST_ACTIVITY_KEY = 'admin_idle_last_activity';

const readLastActivity = () => {
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : 0;
  } catch {
    return 0;
  }
};

const writeLastActivity = (ts) => {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {
    // Neu trinh duyet chan localStorage (che do an danh nghiem ngat...),
    // bo qua - luc do se luon bi khoa khi vao lai, an toan hon la mo toang.
  }
};

const hasSessionUnlock = () => {
  try {
    return window.sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
};

const setSessionUnlock = () => {
  try {
    window.sessionStorage.setItem(SESSION_UNLOCK_KEY, '1');
  } catch {
    // ignore
  }
};

const clearSessionUnlock = () => {
  try {
    window.sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  } catch {
    // ignore
  }
};

/**
 * Khoa man hinh trang admin - yeu cau nhap lai DUNG ma PIN bao mat de tiep
 * tuc, KHONG dang xuat/mat phien lam viec (chi la 1 lop man hinh khoa phu
 * tren cung, giong cach khoa man hinh dien thoai). Khoa trong 2 truong hop:
 *
 *  1) Sau 5 PHUT KHONG THAO TAC GI (di chuot, go phim, cham man hinh, cuon
 *     trang...) - kiem tra dinh ky khi tab dang mo, VA ca khi vua tai/tai
 *     lai trang (so sanh voi moc thoi gian da luu tu truoc).
 *  2) MOI LAN vao lai trang tu dau trong 1 tab/phien trinh duyet MOI (dong
 *     tab roi mo lai, xoa/mo tab moi, may tinh khoi dong lai trinh duyet...)
 *     - luon bat buoc nhap ma, bat ke vua thao tac xong truoc do bao lau.
 *
 * Dat o admin/layout.jsx nen ap dung cho TOAN BO trang admin, khong anh
 * huong gi den cac tai khoan/trang khac (User/VIP/Co van deu khong bi khoa
 * kieu nay).
 */
export default function AdminIdleLock() {
  // Mac dinh khoa ngay tu lan render dau tien: chi mo khi xac nhan chac
  // chan (co co "da mo khoa trong tab nay" VA chua qua han idle) - tranh
  // tinh trang "nhap nhay" 1 khoanh khac lo noi dung admin truoc khi kip
  // khoa lai.
  const [isLocked, setIsLocked] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Xac dinh trang thai khoa NGAY khi component gan vao (moi lan tai/vao
  // lai trang admin) - chay 1 lan duy nhat.
  useEffect(() => {
    const now = Date.now();
    const lastActivity = readLastActivity();
    const idleExpired = lastActivity > 0 && now - lastActivity >= IDLE_LIMIT_MS;

    if (hasSessionUnlock() && !idleExpired) {
      // Da tung mo khoa trong dung tab nay, VA chua roi khoi qua 5 phut ->
      // cho phep tiep tuc (vd chi la F5 lai trang).
      setIsLocked(false);
      lastActivityRef.current = now;
      writeLastActivity(now);
    } else {
      // Chua tung mo khoa trong tab nay (tab/phien moi), HOAC da idle qua
      // han -> bat buoc khoa, xoa het "quyen di qua" cu de tranh vong lap
      // nham lay lai quyen khong qua xac thuc.
      setIsLocked(true);
      clearSessionUnlock();
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      // Chi ghi lai moc hoat dong khi CHUA bi khoa - tranh truong hop thao
      // tac tren chinh man hinh khoa (vd go PIN) lam "reset" nham idle timer
      // truoc khi thuc su xac thuc thanh cong.
      if (!isLocked) writeLastActivity(now);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      if (!isLocked && Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
        setIsLocked(true);
        clearSessionUnlock();
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
      const now = Date.now();
      setSessionUnlock();
      writeLastActivity(now);
      lastActivityRef.current = now;
      setIsLocked(false);
      setPin('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã PIN không đúng.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Chua xac dinh xong trang thai khoa (buoc dau tien) -> khong render gi
  // ca, tranh loe noi dung admin ra 1 khoanh khac truoc khi kip khoa.
  if (!isReady) {
    return <div className="fixed inset-0 z-[9999] bg-ink-950" />;
  }

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-950/95 backdrop-blur-xl">
      <form onSubmit={handleUnlock} className="w-full max-w-sm mx-4 rounded-2xl border border-ink-700 bg-ink-900/80 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-ember-500/10 border border-ember-500/30 flex items-center justify-center mb-3">
            <FiLock className="text-ember-400" size={24} />
          </div>
          <h2 className="font-display font-bold text-lg text-mist-100">Phiên làm việc đã khóa</h2>
          <p className="text-sm text-mist-400 mt-1">Vui lòng nhập mã PIN bảo mật để tiếp tục.</p>
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
