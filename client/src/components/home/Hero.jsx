'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiZap, FiClock } from 'react-icons/fi';
import ParticlesBackground from './ParticlesBackground';

const TRUST_BADGES = [
  { icon: FiShield, label: 'Bảo mật giao dịch' },
  { icon: FiZap, label: 'Nhận hàng 1s' },
  { icon: FiClock, label: 'Hỗ trợ 24/7' },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-radial-glow">
      <ParticlesBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full border border-ember-500/30 bg-ember-500/10 px-4 py-1.5 text-xs font-medium text-ember-400 uppercase tracking-wider"
        >
          Hệ thống cung cấp file tự động
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 font-display font-extrabold text-4xl sm:text-6xl leading-tight text-mist-100"
        >
          Khanghuynh shop,
          <br />
          <span className="text-glow bg-ember-gradient bg-clip-text text-transparent">File - Cheatgame chất lượng</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-2xl mx-auto text-mist-400 text-base sm:text-lg"
        >
          Cung cấp key proxy, file, menu, config chất lượng tương thích mọi thiết bị.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ember-gradient px-7 py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 transition-opacity"
          >
            Khám phá sản phẩm <FiArrowRight />
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-600 bg-ink-800/60 px-7 py-3.5 font-semibold text-mist-100 hover:border-gold-500/50 transition-colors"
          >
            Nạp tiền ngay
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-mist-400">
              <Icon className="text-gold-500" /> {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
