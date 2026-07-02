'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield } from 'react-icons/fi';

const SESSION_KEY = 'khs_human_verified';

/**
 * Lop kiem tra "co phai nguoi khong" o muc do co ban (friction gate), hien
 * MOT LAN moi phien trinh duyet (sessionStorage). Day KHONG PHAI CAPTCHA
 * thuc su (khong chan duoc bot nang cao) - de co bao ve bot manh hon, Admin
 * nen dang ky Google reCAPTCHA hoac Cloudflare Turnstile (can site key rieng
 * cua ban, khong the tu dong tich hop san vi khong co san khoa API).
 *
 * Co che: yeu cau nguoi dung bam giu 1 nut trong >= 600ms (bot script don
 * gian thuong click "tuc thi" 0ms, kho gia lap thao tac giu chuot tu nhien).
 */
export default function HumanGate() {
  const [visible, setVisible] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setVisible(true);
      }
    } catch (e) {
      // sessionStorage khong kha dung (vd disabled) -> bo qua, khong chan trang
    }
  }, []);

  useEffect(() => {
    if (!isHolding) {
      setProgress(0);
      return;
    }
    const start = Date.now();
    const HOLD_MS = 650;
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / HOLD_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch (e) {
          /* noop */
        }
        setVisible(false);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isHolding]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-ink-950/98 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900 p-7 text-center"
          >
            <FiShield className="mx-auto text-ember-400 mb-3" size={32} />
            <h2 className="font-display font-bold text-lg text-mist-100 mb-1.5">Xác minh bạn là con người</h2>
            <p className="text-sm text-mist-400 mb-6">Giữ nút bên dưới trong giây lát để tiếp tục vào Khanghuynh.shop</p>

            <button
              onMouseDown={() => setIsHolding(true)}
              onMouseUp={() => setIsHolding(false)}
              onMouseLeave={() => setIsHolding(false)}
              onTouchStart={() => setIsHolding(true)}
              onTouchEnd={() => setIsHolding(false)}
              className="relative w-full overflow-hidden rounded-xl border border-ember-500/40 py-3.5 text-sm font-semibold text-mist-100 select-none"
            >
              <span
                className="absolute inset-y-0 left-0 bg-ember-gradient transition-[width] duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
              <span className="relative">{progress > 0 ? 'Đang giữ...' : 'Giữ để xác minh'}</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
