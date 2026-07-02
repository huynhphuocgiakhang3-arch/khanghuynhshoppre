'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const BRAND_NAME = 'Khanghuynh';

/**
 * Preloader "Signature Reveal" - phien ban "doan phim ngan 4 giay":
 * tung chu cai cua "Khanghuynh" xuat hien theo hieu ung bay vao + zoom + glow,
 * tao cam giac nhu mot doan intro phim ngan, sau do gach chan quet qua va
 * toan bo logo phat sang ruc ro truoc khi fade-out de vao trang chinh.
 *
 * Tong thoi luong duoc canh chinh xac ~4 giay (an toan tuyet doi neu loi,
 * tu dong fallback sau 6s).
 */
export default function SignaturePreloader({ onComplete }) {
  const containerRef = useRef(null);
  const lettersRef = useRef([]);
  const underlineRef = useRef(null);
  const glowOverlayRef = useRef(null);
  const [isDone, setIsDone] = useState(false);

  const letters = BRAND_NAME.split('');

  useEffect(() => {
    const container = containerRef.current;
    const letterEls = lettersRef.current.filter(Boolean);
    const underline = underlineRef.current;
    const glowOverlay = glowOverlayRef.current;

    if (!container || letterEls.length === 0) return;

    gsap.set(letterEls, { opacity: 0, y: 40, scale: 0.6, rotateX: -90 });
    if (underline) gsap.set(underline, { scaleX: 0, transformOrigin: 'left center' });
    if (glowOverlay) gsap.set(glowOverlay, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container, {
          opacity: 0,
          duration: 0.5,
          delay: 0.2,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsDone(true);
            onComplete?.();
          },
        });
      },
    });

    // Pha 1 (0 - ~1.8s): tung chu cai "bay vao" lien tiep, tao cam giac doan phim dang dung hinh
    tl.to(letterEls, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      duration: 0.55,
      ease: 'back.out(1.8)',
      stagger: 0.09,
    });

    // Pha 2 (~1.8s - 2.5s): gach chan quet qua tu trai sang phai
    if (underline) {
      tl.to(underline, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.1');
    }

    // Pha 3 (~2.5s - 3.4s): toan bo chu phat sang ruc len (hieu ung "khoanh khac dien anh")
    tl.to(
      letterEls,
      {
        scale: 1.06,
        duration: 0.35,
        ease: 'power1.out',
      },
      '-=0.1'
    ).to(letterEls, {
      scale: 1,
      duration: 0.35,
      ease: 'power1.in',
    });

    if (glowOverlay) {
      tl.to(glowOverlay, { opacity: 1, duration: 0.4 }, '-=0.7').to(glowOverlay, {
        opacity: 0,
        duration: 0.6,
      });
    }

    // Pha 4 (~3.4s - 4s): giu hinh anh hoan chinh truoc khi fade-out (xu ly trong onComplete)

    const skip = () => tl.progress(1);
    container.addEventListener('click', skip);

    // An toan tuyet doi: neu vi ly do gi animation khong hoan thanh,
    // tu dong an preloader sau 6s de khong lam ket website
    const safetyTimeout = setTimeout(() => {
      setIsDone(true);
      onComplete?.();
    }, 6000);

    return () => {
      tl.kill();
      clearTimeout(safetyTimeout);
      container.removeEventListener('click', skip);
    };
  }, [onComplete]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-950 cursor-pointer overflow-hidden"
      role="status"
      aria-label="Đang tải Khanghuynh.shop"
    >
      {/* Lop glow phu toan man hinh, sang len o khoanh khac cao trao */}
      <div
        ref={glowOverlayRef}
        className="absolute inset-0 bg-gradient-to-r from-ember-500/10 via-gold-500/15 to-ember-500/10 pointer-events-none"
      />

      <div className="relative flex flex-col items-center px-6" style={{ perspective: '800px' }}>
        <div className="flex">
          {letters.map((char, idx) => (
            <span
              key={idx}
              ref={(el) => (lettersRef.current[idx] = el)}
              className="inline-block font-display font-extrabold text-5xl sm:text-7xl bg-ember-gradient bg-clip-text text-transparent"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {char}
            </span>
          ))}
        </div>

        <div
          ref={underlineRef}
          className="mt-3 h-[3px] w-full max-w-[420px] rounded-full bg-ember-gradient"
        />

        <p className="mt-5 text-mist-400 text-xs tracking-[0.3em] uppercase font-mono animate-pulse-glow">
          Đang chuẩn bị sản phẩm
        </p>
      </div>
    </div>
  );
}
