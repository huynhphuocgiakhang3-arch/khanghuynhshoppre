'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiCheckCircle,
  FiLoader,
  FiCheck,
  FiPackage,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiLayers,
  FiPlay,
} from 'react-icons/fi';
import api from '../../../lib/api';
import { formatVND } from '../../../lib/utils';
import { useAuthStore } from '../../../context/useAuthStore';
import VideoModal from '../../../components/product/VideoModal';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [selectedVariantName, setSelectedVariantName] = useState(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.data);
        if (data.data.variants?.length > 0) {
          setSelectedVariantName(data.data.variants[0].name);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = useMemo(
    () => (hasVariants ? product.variants.find((v) => v.name === selectedVariantName) : null),
    [hasVariants, product, selectedVariantName]
  );

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng.');
      router.push('/auth/login');
      return;
    }

    if (hasVariants && !selectedVariantName) {
      toast.error('Vui lòng chọn gói trước khi mua.');
      return;
    }

    setIsBuying(true);
    try {
      const { data } = await api.post('/orders', {
        items: [
          {
            productId: product._id,
            quantity: 1,
            ...(hasVariants && { variantName: selectedVariantName }),
          },
        ],
      });
      await refreshUser();
      toast.success(`Mua hàng thành công! Mã đơn: ${data.data.orderCode}`);
      router.push('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mua hàng thất bại, vui lòng thử lại.');
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return <div className="py-32 text-center text-mist-500">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <div className="py-32 text-center text-mist-500">Sản phẩm không tồn tại hoặc đã bị gỡ bỏ.</div>;
  }

  // Gia/kho hien thi phu thuoc vao co dang chon variant hay khong
  const displayPrice = hasVariants
    ? selectedVariant
      ? selectedVariant.salePrice ?? selectedVariant.price
      : 0
    : product.salePrice ?? product.price;
  const displayOriginalPrice = hasVariants
    ? selectedVariant?.salePrice
      ? selectedVariant.price
      : null
    : product.salePrice
    ? product.price
    : null;
  const hasDiscount = Boolean(displayOriginalPrice);
  const discountPercent = hasDiscount
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0;
  const displayStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const isOutOfStock = displayStock === 0;

  return (
    <div className="bg-radial-glow">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner lon full-width phia tren, co animation glow + particle lien tuc */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-ink-700 bg-ink-800">
          {product.thumbnail ? (
            <Image src={product.thumbnail} alt={product.name} fill priority className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-mist-500">Không có ảnh</div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />

          {/* Shimmer anh sang quet ngang qua banner, lap lai vo han */}
          <motion.div
            animate={{ x: ['-130%', '230%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none skew-x-12"
          />

          {/* Hat sang nho troi nhe lien tuc tren banner */}
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -18, 0], opacity: [0.15, 0.85, 0.15] }}
              transition={{ duration: 2.8 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
              className="absolute h-1.5 w-1.5 rounded-full bg-gold-400 pointer-events-none"
              style={{ left: `${15 + i * 22}%`, top: `${25 + (i % 2) * 30}%` }}
            />
          ))}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-full bg-ink-950/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gold-400 capitalize border border-gold-500/20">
              {product.category || 'Khác'}
            </span>
            {hasDiscount && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center gap-1 rounded-full bg-ember-gradient px-3 py-1.5 text-xs font-bold text-ink-950 shadow-ember"
              >
                <FiZap size={12} /> Giảm {discountPercent}%
              </motion.span>
            )}
          </div>

          <span
            className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm border ${
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

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-mist-100 drop-shadow-lg">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-2 text-sm sm:text-base text-mist-300 max-w-2xl">{product.shortDescription}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          {/* Cot trai: tinh nang + mo ta chi tiet */}
          <div className="lg:col-span-2 space-y-8">
            {/* Khu vuc video test - hien truoc khi khach quyet dinh mua, tang
                do tin cay. Thiet ke dang "hero video card": poster lon, nut
                Play glow o giua, badge "Video test" goc tren, hover zoom nhe. */}
            {product.testVideoUrl && (
              <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-6">
                <h2 className="flex items-center gap-2 font-display font-semibold text-lg text-mist-100 mb-4">
                  <FiPlay className="text-ember-400" /> Video test sản phẩm
                </h2>
                <button
                  type="button"
                  onClick={() => setIsVideoOpen(true)}
                  className="group relative block w-full aspect-video overflow-hidden rounded-xl border border-ink-600"
                >
                  {(product.testVideoThumbnail || product.thumbnail) && (
                    <Image
                      src={product.testVideoThumbnail || product.thumbnail}
                      alt={`Video test ${product.name}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-ink-950/40 group-hover:bg-ink-950/25 transition-colors" />
                  <motion.span
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(255,87,34,0.5)',
                        '0 0 28px rgba(255,87,34,0.7)',
                        '0 0 0px rgba(255,87,34,0.5)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-ember-gradient text-ink-950"
                  >
                    <FiPlay size={24} className="ml-1" />
                  </motion.span>
                  <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ink-950/85 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-mist-200 border border-ink-600">
                    <FiPlay size={10} /> Xem trước khi mua
                  </span>
                </button>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-6">
                <h2 className="font-display font-semibold text-lg text-mist-100 mb-4">Tính năng nổi bật</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400 mt-0.5">
                        <FiCheck size={12} />
                      </span>
                      <span className="text-sm text-mist-300 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-6">
                <h2 className="font-display font-semibold text-lg text-mist-100 mb-3">Mô tả chi tiết</h2>
                <p className="text-sm text-mist-400 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* Cot phai: chon goi + gia + mua hang, sticky de luon thay khi cuon trang dai */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink-700 bg-ink-800/60 p-6">
              {/* Chon goi (variant) neu san pham co nhieu lua chon */}
              {hasVariants && (
                <div className="mb-5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-mist-300 mb-2.5">
                    <FiLayers size={14} /> Chọn gói
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const variantOutOfStock = variant.stock === 0;
                      return (
                        <button
                          key={variant.name}
                          onClick={() => setSelectedVariantName(variant.name)}
                          disabled={variantOutOfStock}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            selectedVariantName === variant.name
                              ? 'bg-ember-gradient text-ink-950'
                              : 'border border-ink-600 text-mist-300 hover:border-ember-500/50'
                          }`}
                        >
                          {variant.name}
                          {variantOutOfStock && ' (Hết)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-baseline gap-3">
                {hasDiscount && (
                  <span className="text-mist-500 line-through text-sm">{formatVND(displayOriginalPrice)}</span>
                )}
                <span className="font-display font-extrabold text-3xl text-ember-500">{formatVND(displayPrice)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-ink-900/60 border border-ink-700 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-mist-500">
                    <FiPackage size={12} /> Kho
                  </p>
                  <p className="mt-0.5 font-display font-bold text-mist-100">{displayStock}</p>
                </div>
                <div className="rounded-xl bg-ink-900/60 border border-ink-700 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-mist-500">
                    <FiTrendingUp size={12} /> Đã bán
                  </p>
                  <p className="mt-0.5 font-display font-bold text-mist-100">{product.soldCount || 0}</p>
                </div>
              </div>

              <motion.button
                onClick={handleBuyNow}
                disabled={isBuying || isOutOfStock}
                animate={!isOutOfStock ? { boxShadow: ['0 0 0px rgba(255,87,34,0.4)', '0 0 22px rgba(255,87,34,0.6)', '0 0 0px rgba(255,87,34,0.4)'] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-ember-gradient px-8 py-3.5 font-semibold text-ink-950 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isBuying ? (
                  <>
                    <FiLoader className="animate-spin" /> Đang xử lý...
                  </>
                ) : isOutOfStock ? (
                  'Hết hàng'
                ) : (
                  <>
                    <FiShoppingCart /> Mua ngay bằng Ví
                  </>
                )}
              </motion.button>

              <div className="mt-5 space-y-2.5 pt-5 border-t border-ink-700">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <FiCheckCircle /> Nhận hàng 1 giây sau thanh toán
                </div>
                <div className="flex items-center gap-2 text-sm text-mist-400">
                  <FiShield /> Giao dịch bảo mật, an toàn 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isVideoOpen && product.testVideoUrl && (
        <VideoModal
          src={product.testVideoUrl}
          poster={product.testVideoThumbnail || product.thumbnail}
          title={product.name}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </div>
  );
}
