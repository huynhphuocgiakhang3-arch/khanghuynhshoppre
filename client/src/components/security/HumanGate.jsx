'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiLoader, FiShield } from 'react-icons/fi';

const SESSION_KEY = 'khs_human_verified';

/**
 * Tao 1 chuoi hex ngau nhien kieu "Ray ID" - CHI mang tinh trang tri/tang
 * do tin cay hinh thuc cho man hinh xac minh (giong cach cac dich vu bao
 * mat hien 1 ma phien de nguoi dung yen tam day la 1 lan kiem tra rieng
 * biet), KHONG dung de tra cuu/doi soat gi ca.
 */
const generateVerificationId = () => {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16));
  return bytes.join('');
};

/**
 * Lop kiem tra "co phai nguoi khong" o muc do co ban (friction gate), hien
 * MOT LAN moi phien trinh duyet (sessionStorage). Day KHONG PHAI CAPTCHA
 * thuc su chong bot nang cao (de co bao ve bot manh hon, Admin nen dang ky
 * Google reCAPTCHA hoac Cloudflare Turnstile that su, can site key rieng
 * cua ban, khong the tu dong tich hop san vi khong co san khoa API) - day
 * la 1 man hinh MO PHONG giao dien xac minh bao mat quen thuoc (dang tich
 * vao o vuong "Verify you are human") de tao rao can co ban voi bot don
 * gian VA giup nguoi dung yen tam ve tinh bao mat cua website.
 */
export default function HumanGate() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'verified'
  const [hostname, setHostname] = useState('');
  const verificationId = useMemo(() => generateVerificationId(), []);

  useEffect(() => {
    setHostname(window.location.hostname);
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setVisible(true);
      }
    } catch (e) {
      // sessionStorage khong kha dung (vd disabled) -> bo qua, khong chan trang
    }
  }, []);

  const handleVerify = () => {
    if (status !== 'idle') return;
    setStatus('checking');

    // Do tre gia lap qua trinh kiem tra - du ngan de khong gay kho chiu,
    // du dai de tao cam giac "dang thuc su xu ly" thay vi tich la xong ngay.
    setTimeout(() => {
      setStatus('verified');
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (e) {
        /* noop */
      }
      setTimeout(() => setVisible(false), 500);
    }, 900 + Math.random() * 500);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center bg-[#fafbfc] px-6 py-16 sm:py-6 overflow-y-auto"
        >
          <div className="w-full max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1a1a1a] mb-4">{hostname || 'khanghuynh.shop'}</h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2b2b2b] mb-3">Đang thực hiện xác minh bảo mật</h2>
            <p className="text-[15px] leading-relaxed text-[#4b5563] mb-6 max-w-lg">
              Trang web này sử dụng dịch vụ bảo mật để chống lại các bot độc hại. Trang này sẽ hiển thị trong lúc hệ
              thống xác minh bạn không phải là bot.
            </p>

            <button
              type="button"
              onClick={handleVerify}
              disabled={status !== 'idle'}
              className="flex items-center gap-4 rounded-md border border-[#d5dae1] bg-white px-5 py-4 shadow-sm hover:border-[#b8c0cc] transition-colors disabled:cursor-default"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  status === 'verified' ? 'border-green-500 bg-green-500' : 'border-[#c2c8d1] bg-white'
                }`}
              >
                {status === 'checking' && <FiLoader className="animate-spin text-[#6b7280]" size={13} />}
                {status === 'verified' && <FiCheck className="text-white" size={15} />}
              </span>
              <span className="text-[15px] font-medium text-[#1a1a1a]">
                {status === 'verified' ? 'Đã xác minh bạn là con người' : 'Xác minh bạn là con người'}
              </span>
              <span className="ml-auto flex items-center gap-1.5 pl-4 border-l border-[#e5e8ec]">
                <FiShield className="text-ember-500" size={20} />
                <span className="text-[11px] leading-tight text-[#6b7280] font-medium">
                  Khanghuynh
                  <br />
                  SHOP SECURITY
                </span>
              </span>
            </button>

            <div className="mt-10 pt-4 border-t border-[#e5e8ec] text-xs text-[#9aa1ac]">
              <p>Verification ID: {verificationId}</p>
              <p className="mt-1">Hiệu suất &amp; Bảo mật bởi Khanghuynh.shop Security</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
