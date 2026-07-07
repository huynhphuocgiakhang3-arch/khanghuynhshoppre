'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiZap, FiDollarSign, FiLoader, FiLogOut } from 'react-icons/fi';
import RequireAuth from '../../components/auth/RequireAuth';
import { useAuthStore } from '../../context/useAuthStore';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';

/**
 * Trang danh RIENG cho tai khoan Co van - CHI CO 1 O DUY NHAT: so du hoa
 * hong hien tai, va 1 nut "Rut tien". Khong co gi khac (khong menu, khong
 * lich su don hang...) - dung nhu yeu cau "chi co dung 1 o tien va rut".
 *
 * Vi Header/Footer bi an hoan toan voi role nay (xem SiteChrome.jsx), trang
 * nay PHAI tu co nut Dang xuat rieng - neu khong Co van se khong co cach
 * nao thoat khoi tai khoan tren giao dien (chi co the xoa cookie thu cong).
 */
function AdvisorContent() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchBalance = async () => {
    try {
      const { data } = await api.get('/advisor/me');
      setBalance(data.data.balance);
    } catch (error) {
      toast.error('Không tải được số dư.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleWithdraw = async () => {
    if (!confirm(`Xác nhận rút toàn bộ ${formatVND(balance)}? Admin sẽ nhận được thông báo và chuyển khoản cho bạn.`)) return;

    setIsWithdrawing(true);
    try {
      const { data } = await api.post('/advisor/withdraw');
      toast.success(data.message);
      setBalance(data.data.balance);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rút tiền thất bại.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('Đăng xuất khỏi tài khoản Cố vấn?')) return;
    logout();
    router.replace('/auth/login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#05040a] px-4">
      {/* Nen toi + hao quang mo dan sau, khong lam chu roi mat */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,0,255,0.15),transparent_60%)]" />

      <button
        onClick={handleLogout}
        title="Đăng xuất"
        className="absolute top-5 right-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
      >
        <FiLogOut size={14} /> Đăng xuất
      </button>

      <style>{`
        @keyframes neon-cycle {
          0%   { color: #ff005c; text-shadow: 0 0 10px #ff005c, 0 0 30px #ff005c, 0 0 60px #ff005c; }
          14%  { color: #ff8c00; text-shadow: 0 0 10px #ff8c00, 0 0 30px #ff8c00, 0 0 60px #ff8c00; }
          28%  { color: #ffee00; text-shadow: 0 0 10px #ffee00, 0 0 30px #ffee00, 0 0 60px #ffee00; }
          42%  { color: #39ff14; text-shadow: 0 0 10px #39ff14, 0 0 30px #39ff14, 0 0 60px #39ff14; }
          57%  { color: #00eaff; text-shadow: 0 0 10px #00eaff, 0 0 30px #00eaff, 0 0 60px #00eaff; }
          71%  { color: #3b82ff; text-shadow: 0 0 10px #3b82ff, 0 0 30px #3b82ff, 0 0 60px #3b82ff; }
          85%  { color: #b429ff; text-shadow: 0 0 10px #b429ff, 0 0 30px #b429ff, 0 0 60px #b429ff; }
          100% { color: #ff005c; text-shadow: 0 0 10px #ff005c, 0 0 30px #ff005c, 0 0 60px #ff005c; }
        }
        @keyframes neon-border-cycle {
          0%   { border-color: #ff005c; box-shadow: 0 0 20px #ff005c, inset 0 0 20px rgba(255,0,92,0.15); }
          14%  { border-color: #ff8c00; box-shadow: 0 0 20px #ff8c00, inset 0 0 20px rgba(255,140,0,0.15); }
          28%  { border-color: #ffee00; box-shadow: 0 0 20px #ffee00, inset 0 0 20px rgba(255,238,0,0.15); }
          42%  { border-color: #39ff14; box-shadow: 0 0 20px #39ff14, inset 0 0 20px rgba(57,255,20,0.15); }
          57%  { border-color: #00eaff; box-shadow: 0 0 20px #00eaff, inset 0 0 20px rgba(0,234,255,0.15); }
          71%  { border-color: #3b82ff; box-shadow: 0 0 20px #3b82ff, inset 0 0 20px rgba(59,130,255,0.15); }
          85%  { border-color: #b429ff; box-shadow: 0 0 20px #b429ff, inset 0 0 20px rgba(180,41,255,0.15); }
          100% { border-color: #ff005c; box-shadow: 0 0 20px #ff005c, inset 0 0 20px rgba(255,0,92,0.15); }
        }
        .neon-text { animation: neon-cycle 6s linear infinite; }
        .neon-border { animation: neon-border-cycle 6s linear infinite; }
      `}</style>

      <div className="relative z-10 w-full max-w-md rounded-3xl border-2 neon-border bg-black/60 backdrop-blur-xl p-8 sm:p-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2 text-xs uppercase tracking-[0.3em] text-white/50">
          <FiZap size={12} /> Cố Vấn Dashboard
        </div>

        <p className="text-sm text-white/60 mb-1">Số dư hoa hồng hiện tại</p>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <FiLoader className="animate-spin text-3xl text-white/50" />
          </div>
        ) : (
          <h1 className="neon-text font-display font-black text-4xl sm:text-5xl py-6 tracking-tight">
            {formatVND(balance)}
          </h1>
        )}

        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isLoading || !balance}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border-2 neon-border bg-white/5 py-4 font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isWithdrawing ? <FiLoader className="animate-spin" /> : <FiDollarSign />}
          {isWithdrawing ? 'Đang gửi yêu cầu...' : 'RÚT TIỀN'}
        </button>

        <p className="mt-4 text-[11px] text-white/40">
          Bấm rút tiền sẽ gửi thông báo cho Admin để chuyển khoản cho bạn.
        </p>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  return (
    <RequireAuth requiredRole="advisor">
      <AdvisorContent />
    </RequireAuth>
  );
}
