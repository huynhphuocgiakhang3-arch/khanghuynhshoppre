'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiCopy, FiLoader, FiCheckCircle, FiClock, FiUpload, FiCheck } from 'react-icons/fi';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';
import { useAuthStore } from '../../context/useAuthStore';


/**
 * Component nap tien: nguoi dung chon so tien -> tao QR -> he thong tu dong
 * poll API moi 5 giay de kiem tra giao dich da duoc doi soat (qua webhook
 * tu cong trung gian SePay/Casso/PayOS) hay chua.
 */
export default function DepositQRModal({ onClose, onSuccess }) {
  const { refreshUser } = useAuthStore();
  const [step, setStep] = useState('input'); // 'input' | 'qr' | 'success'
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSent, setProofSent] = useState(false);
  const proofInputRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  const handleCreateQR = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 10000) {
      toast.error('Số tiền nạp tối thiểu 10.000 VND.');
      return;
    }

    setIsCreating(true);
    try {
      const { data } = await api.post('/wallet/deposit/create-qr', { amount: numericAmount });
      setQrData(data.data);
      setStep('qr');
      startPolling(data.data.transferContent, numericAmount);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo mã QR.');
    } finally {
      setIsCreating(false);
    }
  };

  // Poll CHU DONG moi 5 giay: goi /api/check-payment, server se tu goi
  // sang SePay bang BANK_TOKEN de kiem tra xem da co giao dich chuyen
  // khoan dung ma + du tien hay chua (khong bi dong cho webhook nua).
  const startPolling = (code, requiredAmount) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/check-payment', { params: { code, amount: requiredAmount } });
        if (data.success) {
          clearInterval(pollRef.current);
          setStep('success');
          toast.success('Thanh toán thành công!');
          await refreshUser();
          onSuccess?.();
        }
        // data.success === false -> "Dang cho thanh toan", tiep tuc poll binh thuong
      } catch (error) {
        // im lang, se thu lai lan poll sau
      }
    }, 5000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  /** Khach upload anh chup man hinh xac nhan da chuyen khoan, giup Admin duyet nhanh hon */
  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !qrData) return;

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Giong ly do sua o CardTopupModal.jsx: PHAI set Content-Type = undefined
      // (khong phai chuoi 'multipart/form-data' suong) de axios bo hoan toan
      // header nay, cho trinh duyet tu dien boundary dung chuan. Neu khong,
      // header 'application/json' mac dinh cua instance `api` co the de lai
      // dau vet gay loi parse file phia server trong 1 so truong hop.
      const { data } = await api.post(`/wallet/deposit/${qrData.transactionId}/proof`, formData, {
        headers: { 'Content-Type': undefined },
      });
      toast.success(data.message || 'Đã gửi ảnh xác nhận.');
      setProofSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi ảnh thất bại.');
    } finally {
      setIsUploadingProof(false);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {step === 'input' && (
          <>
            <h2 className="font-display font-bold text-xl text-mist-100">Nạp tiền vào ví</h2>
            <p className="text-sm text-mist-400 mt-1 mb-5">Nhập số tiền bạn muốn chuyển khoản</p>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="20.000"
              className="w-full rounded-xl glass-input px-4 py-4 text-lg text-mist-100 placeholder:text-mist-600"
              autoFocus
            />
            <p className="mt-2 text-xs text-mist-500">
              Nhập đúng số tiền bạn sẽ chuyển khoản — bot Telegram sẽ báo về đúng số tiền này để đối chiếu.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-ink-600 py-3 text-sm font-medium text-mist-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateQR}
                disabled={isCreating}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
              >
                {isCreating ? <FiLoader className="animate-spin" /> : 'Tạo mã QR'}
              </button>
            </div>
          </>
        )}

        {step === 'qr' && qrData && (
          <>
            <h2 className="font-display font-bold text-xl text-mist-100 text-center">Quét mã để thanh toán</h2>
            <div className="mt-4 flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <Image src={qrData.qrImageUrl} alt="Mã QR MB Bank" width={240} height={240} unoptimized />
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-ink-700">
                <span className="text-mist-400">Ngân hàng</span>
                <span className="text-mist-100 font-medium">{qrData.bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-700">
                <span className="text-mist-400">Số tài khoản</span>
                <button onClick={() => handleCopy(qrData.bankInfo.accountNo)} className="flex items-center gap-1.5 text-mist-100 font-medium">
                  {qrData.bankInfo.accountNo} <FiCopy size={12} />
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-700">
                <span className="text-mist-400">Số tiền</span>
                <span className="text-ember-500 font-bold">{formatVND(qrData.bankInfo.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-700">
                <span className="text-mist-400">Nội dung CK</span>
                <button onClick={() => handleCopy(qrData.transferContent)} className="flex items-center gap-1.5 text-gold-400 font-bold font-mono">
                  {qrData.transferContent} <FiCopy size={12} />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gold-400 animate-pulse-glow">
              <FiClock /> Đang chờ thanh toán... (tự động cập nhật)
            </div>

            <div className="mt-4 rounded-xl border border-ink-600 p-3.5">
              {proofSent ? (
                <p className="flex items-center justify-center gap-2 text-sm text-green-400">
                  <FiCheck /> Đã gửi bill chuyển khoản, đang chờ Admin duyệt
                </p>
              ) : (
                <>
                  <p className="text-xs text-mist-400 text-center mb-2.5">
                    Gửi bill chuyển khoản (chụp ảnh hoặc chọn từ thư viện) để Admin duyệt nhanh hơn.
                  </p>
                  <input
                    ref={proofInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadProof}
                    className="hidden"
                    id="deposit-proof-upload"
                  />
                  <label
                    htmlFor="deposit-proof-upload"
                    className="flex items-center justify-center gap-2 rounded-xl border border-ember-500/40 py-2.5 text-sm text-mist-200 cursor-pointer hover:border-ember-500/70"
                  >
                    {isUploadingProof ? <FiLoader className="animate-spin" /> : <FiUpload />}
                    {isUploadingProof ? 'Đang gửi...' : 'Gửi bill chuyển khoản'}
                  </label>
                </>
              )}
            </div>

            <p className="mt-3 text-xs text-mist-500 text-center">
              Vui lòng giữ đúng nội dung chuyển khoản để hệ thống tự động cộng tiền.
            </p>

            <p className="mt-2 text-xs text-gold-400/90 text-center leading-relaxed">
              {qrData.bankInfo.depositNote ||
                'Nếu chuyển tiền rồi mà vẫn không cộng số dư liên hệ Zalo admin để được hỗ trợ nhé'}
            </p>

            <button onClick={onClose} className="mt-5 w-full rounded-xl border border-ink-600 py-3 text-sm font-medium text-mist-300">
              Đóng
            </button>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <FiCheckCircle className="mx-auto text-5xl text-green-400 mb-4" />
            <h2 className="font-display font-bold text-xl text-mist-100">Nạp tiền thành công!</h2>
            <p className="text-sm text-mist-400 mt-2">Số dư của bạn đã được cập nhật.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
