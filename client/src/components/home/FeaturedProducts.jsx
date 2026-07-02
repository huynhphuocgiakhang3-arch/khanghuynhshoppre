'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import api from '../../lib/api';
import { useLiveData } from '../../hooks/useLiveData';

export default function FeaturedProducts() {
  const { data: products, isLoading } = useLiveData(
    async () => {
      const { data } = await api.get('/products', { params: { featured: 'true', limit: 6 } });
      return data.data;
    },
    [],
    3000
  );

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-mist-100">Sản phẩm nổi bật</h2>
          <p className="text-mist-400 text-sm mt-1">Được khách hàng lựa chọn nhiều nhất</p>
        </div>
        <Link href="/products" className="hidden sm:flex items-center gap-1 text-sm font-medium text-ember-400 hover:text-ember-300">
          Xem tất cả <FiArrowRight />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-ink-800 animate-pulse" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <p className="text-center text-mist-500 py-12">Chưa có sản phẩm nổi bật nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, idx) => (
            <ProductCard key={product._id} product={product} delay={idx * 0.2} />
          ))}
        </div>
      )}
    </section>
  );
}
