'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiCheck, FiPackage, FiTrendingUp, FiShoppingCart, FiLayers, FiPlay, FiStar } from 'react-icons/fi';
import { formatVND } from '../../lib/utils';
import VideoModal from './VideoModal';

/**
 * Card san pham phong cach "landing page mini": banner lon, badge danh muc +
 * trang thai kho, tieu de IN HOA dam, checklist tinh nang day du, dai so lieu
 * (Kho/Goi/Da ban), khoang gia "Tu X - Y" neu co nhieu goi (variants).
 *
 * Hieu ung animation lien tuc (khong chi khi hover) de tao cam giac "song dong":
 * - Vien glow nhip nhe theo chu ky (pulse), mau ember/gold xen ke
 * - Lop anh sang "shimmer" quet ngang qua banner anh moi vai giay
 * - Cac hat sang nho li ti troi nhe phia tren banner (giong particle)
 * - Nut Mua co glow tho nhe lien tuc de thu hut chu y
 */
export default function ProductCard({ product, delay = 0 }) {
  const hasVariants = product.variants && product.variants.length > 0;
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const hasTestVideo = Boolean(product.testVideoUrl);

  let minPrice, maxPrice, originalMinPrice;
  let vipMinPrice = null;
  if (hasVariants) {
    const prices = product.variants.map((v) => v.salePrice ?? v.price);
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
    const vipPrices = product.variants.map((v) => v.vipPrice ?? (v.salePrice ?? v.price));
    const hasAnyVip = product.variants.some((v) => v.vipPrice);
    if (hasAnyVip) vipMinPrice = Math.min(...vipPrices);
  } else {
    minPrice = product.salePrice ?? product.price;
    maxPrice = minPrice;
    originalMinPrice = product.salePrice ? product.price : null;
    vipMinPrice = product.vipPrice || null;
  }

  const totalStock = hasVariants
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : product.stock;
  const isOutOfStock = totalStock === 0;
  const features = (product.features || []).slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay * 0.15 }}
      className="group relative h-full"
    >
      {/* Vien glow nhip lien tuc, doi mau ember <-> gold theo chu ky, tao
          cam giac "song dong" ngay ca khi khong hover */}
      <motion.div
        animate={{
          opacity: [0.15, 0.5, 0.15],
          background: [
            'linear-gradient(135deg, #ff5722, #f5b942)',
            'linear-gradient(135deg, #f5b942, #ff5722)',
            'linear-gradient(135deg, #ff5722, #f5b942)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.3 }}
        className="absolute -inset-px rounded-2xl blur-md pointer-events-none"
      />

      <Link
        href={`/product/${product.slug}`}
        className="relative flex h-full flex-col rounded-2xl border border-ink-700 bg-ink-800 overflow-hidden hover:border-ember-500/40 transition-colors duration-300"
      >
        {/* Banner lon phia tren */}
        <div className="relative aspect-[16/10] bg-ink-700 overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-mist-500 text-sm">
              Không có ảnh
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent pointer-events-none" />

          {/* Lop anh sang "shimmer" quet ngang qua banner lien tuc moi vai giay */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut', delay: delay * 0.4 }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none skew-x-12"
          />

          {/* Vai hat sang nho troi nhe phia tren banner, lap lai vo han */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                y: [0, -14, 0],
                opacity: [0.2, 0.9, 0.2],
              }}
              transition={{
                duration: 2.4 + i * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.7 + delay * 0.2,
              }}
              className="absolute h-1 w-1 rounded-full bg-gold-400 pointer-events-none"
              style={{ left: `${22 + i * 28}%`, top: `${30 + (i % 2) * 18}%` }}
            />
          ))}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="rounded-full bg-ink-950/85 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-gold-400 capitalize border border-gold-500/20">
              {product.category || 'Khác'}
            </span>
            {product.isPinned && (
              <span className="flex items-center gap-1 rounded-full bg-gold-500/20 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-gold-300 border border-gold-500/40">
                <FiStar size={10} className="fill-gold-300" /> Ghim
              </span>
            )}
          </div>

          <span
            className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-sm border ${
              isOutOfStock
                ? 'bg-ink-950/85 text-red-400 border-red-500/30'
                : 'bg-ink-950/85 text-green-400 border-green-500/30'
            }`}
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-green-400'}`}
            />
            {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
          </span>

          {/* Nut xem video test - chi hien khi san pham co video, khong dieu
              huong sang trang chi tiet (stopPropagation + preventDefault) */}
          {hasTestVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVideoOpen(true);
              }}
              className="absolute inset-0 flex items-center justify-center group/video"
              aria-label="Xem video test sản phẩm"
            >
              <motion.span
                animate={{ boxShadow: ['0 0 0px rgba(255,87,34,0.5)', '0 0 22px rgba(255,87,34,0.7)', '0 0 0px rgba(255,87,34,0.5)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950/70 backdrop-blur-sm border border-ember-500/50 text-ember-400 opacity-0 group-hover/video:opacity-100 sm:opacity-90 transition-opacity"
              >
                <FiPlay size={18} className="ml-0.5" />
              </motion.span>
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ink-950/85 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-mist-200 border border-ink-600">
                <FiPlay size={10} /> Video test
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display font-extrabold text-base sm:text-lg uppercase tracking-tight text-mist-100 group-hover:text-ember-400 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Checklist tinh nang day du, hien ngay tren card */}
          {features.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-mist-300 leading-snug">
                  <FiCheck className="text-green-400 shrink-0 mt-0.5" size={13} />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {!features.length && product.shortDescription && (
            <p className="mt-2 text-xs text-mist-400 leading-relaxed line-clamp-2">{product.shortDescription}</p>
          )}

          <div className="mt-auto pt-4">
            {/* Dai so lieu: Kho / Goi / Da ban */}
            <div className="flex items-center gap-4 text-[11px] text-mist-500 pb-3 border-b border-ink-700/60">
              <span className="flex items-center gap-1">
                <FiPackage size={12} /> Kho: <b className="text-mist-300">{totalStock}</b>
              </span>
              {hasVariants && (
                <span className="flex items-center gap-1">
                  <FiLayers size={12} /> Gói: <b className="text-mist-300">{product.variants.length}</b>
                </span>
              )}
              <span className="flex items-center gap-1">
                <FiTrendingUp size={12} /> Đã bán: <b className="text-mist-300">{product.soldCount || 0}</b>
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                {vipMinPrice ? (
                  <>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                      👑 GIÁ VIP -50%
                    </span>
                    <span className="block text-xs text-mist-500 line-through">{formatVND(minPrice)}</span>
                    <p className="font-display font-extrabold text-lg sm:text-xl text-amber-300 leading-tight">
                      {formatVND(vipMinPrice)}
                    </p>
                  </>
                ) : (
                  <>
                    {originalMinPrice && (
                      <span className="block text-xs text-mist-500 line-through">{formatVND(originalMinPrice)}</span>
                    )}
                    <span className="text-[10px] text-mist-500 uppercase tracking-wide">Từ</span>
                    <p className="font-display font-extrabold text-lg sm:text-xl text-ember-500 leading-tight">
                      {hasVariants && minPrice !== maxPrice
                        ? `${formatVND(minPrice)} - ${formatVND(maxPrice)}`
                        : formatVND(minPrice)}
                    </p>
                  </>
                )}
              </div>

              {/* Nut Mua co glow tho nhe lien tuc */}
              <motion.span
                animate={{ boxShadow: ['0 0 0px rgba(255,87,34,0.4)', '0 0 16px rgba(255,87,34,0.55)', '0 0 0px rgba(255,87,34,0.4)'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.25 }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ember-gradient px-4 py-2.5 text-xs font-bold text-ink-950"
              >
                <FiShoppingCart size={13} /> Mua
              </motion.span>
            </div>
          </div>
        </div>
      </Link>

      {isVideoOpen && (
        <VideoModal
          src={product.testVideoUrl}
          poster={product.testVideoThumbnail || product.thumbnail}
          title={product.name}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </motion.div>
  );
}
