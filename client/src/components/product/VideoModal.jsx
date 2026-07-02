'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiLoader, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi';

/**
 * Lightbox video chuyen nghiep, dung chung cho ca ProductCard (video test
 * nhanh tren the san pham) va trang chi tiet san pham (video demo truoc khi mua).
 *
 * UX/animation:
 * - Backdrop fade + blur, panel scale-in/spring khi mo, scale-out khi dong
 * - Dong bang nut X, bam ra ngoai backdrop, hoac phim ESC
 * - Khoa scroll nen khi modal mo
 * - Skeleton loading (spinner + shimmer) trong luc video buffer
 * - Nut tat/bat tieng noi (video mac dinh co tieng, nhung de phong truong
 *   hop trinh duyet chan autoplay co tieng thi khong autoplay - nguoi dung
 *   tu bam play, nen khong bi chan)
 */
export default function VideoModal({ src, poster, title, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="video-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/90 backdrop-blur-md p-4"
      >
        <motion.div
          key="video-modal-panel"
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl"
        >
          {/* Vien glow ember quanh panel de dong bo phong cach voi phan con lai cua web */}
          <div className="absolute -inset-px rounded-2xl bg-ember-gradient opacity-40 blur-md pointer-events-none" />

          <div className="relative rounded-2xl overflow-hidden border border-ink-700 bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700/80 bg-ink-950/60">
              <p className="flex items-center gap-2 text-sm font-semibold text-mist-100 truncate">
                <FiPlay className="text-ember-400 shrink-0" size={14} />
                {title || 'Video test sản phẩm'}
              </p>
              <button
                onClick={onClose}
                aria-label="Đóng video"
                className="shrink-0 rounded-full p-1.5 text-mist-400 hover:text-mist-100 hover:bg-ink-700/60 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900">
                  <FiLoader className="animate-spin text-ember-400" size={28} />
                  <span className="text-xs text-mist-500">Đang tải video...</span>
                </div>
              )}

              <video
                ref={videoRef}
                src={src}
                poster={poster || undefined}
                controls
                autoPlay
                muted={isMuted}
                playsInline
                onCanPlay={() => setIsLoading(false)}
                onLoadedData={() => setIsLoading(false)}
                className="h-full w-full"
              />

              <button
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 backdrop-blur-sm border border-ink-600 p-2 text-mist-300 hover:text-mist-100 transition-colors"
              >
                {isMuted ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
