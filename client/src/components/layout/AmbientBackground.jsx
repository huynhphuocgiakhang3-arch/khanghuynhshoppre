'use client';

import { motion } from 'framer-motion';

/**
 * Nen hieu ung "lung linh" chay vo han, dung chung cho ca Shop va Admin de
 * dam bao cam giac chuyen dong muot ma, dong bo phong cach xuyen suot web:
 * - 2 quang glow lon (ember/gold) tho nhe + troi qua lai cham (nhu "hoi tho")
 * - Luoi hat sang li ti nhap nhay ngau nhien, mo phong "particle" bay lo lung
 * - Toan bo dat position fixed, z-0, pointer-events-none -> khong anh huong
 *   thao tac cua nguoi dung, khong lam nang trang (chi dung transform/opacity
 *   de GPU dam nhiem, khong reflow layout)
 */
export default function AmbientBackground({ variant = 'shop' }) {
  const particleCount = variant === 'admin' ? 14 : 22;
  const particles = Array.from({ length: particleCount });

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Quang glow lon thu 1 - mau ember, troi cham theo hinh elip, bien do rong hon */}
      <motion.div
        animate={{
          x: ['-20%', '18%', '-20%'],
          y: ['-12%', '22%', '-12%'],
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.55, 0.3],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1/4 -left-1/4 h-[65vh] w-[65vh] rounded-full bg-ember-500/25 blur-[110px]"
      />

      {/* Quang glow lon thu 2 - mau gold, troi nguoc chieu */}
      <motion.div
        animate={{
          x: ['15%', '-18%', '15%'],
          y: ['18%', '-16%', '18%'],
          scale: [1.1, 0.9, 1.1],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-1/4 -right-1/4 h-[60vh] w-[60vh] rounded-full bg-gold-500/25 blur-[110px]"
      />

      {/* Quang glow thu 3 - nho hon, troi cheo qua giua man hinh, tao chieu sau */}
      <motion.div
        animate={{
          x: ['-10%', '30%', '-10%'],
          y: ['30%', '-10%', '30%'],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        className="absolute top-1/3 left-1/3 h-[40vh] w-[40vh] rounded-full bg-ember-400/20 blur-[100px]"
      />

      {/* Luoi hat sang li ti, moi hat nhap nhay + troi doc lap lai vo han, bien do lon hon */}
      {particles.map((_, i) => {
        const left = (i * 137.5) % 100; // phan bo deu bang golden angle, tranh trung lap
        const top = (i * 71.3) % 100;
        const duration = 4 + (i % 6) * 1.3;
        const delay = (i % 8) * 0.5;
        const drift = 30 + (i % 4) * 12; // moi hat bay xa gan khac nhau, sinh dong hon
        return (
          <motion.span
            key={i}
            animate={{ y: [0, -drift, 0], x: [0, (i % 2 === 0 ? 1 : -1) * (drift / 3), 0], opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
            className="absolute h-1.5 w-1.5 rounded-full bg-gold-400"
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}
