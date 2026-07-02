'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard';
import api from '../../lib/api';
import { useLiveData } from '../../hooks/useLiveData';

export default function ProductsPage() {
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState(''); // gia tri dang go, chua submit
  const [search, setSearch] = useState(''); // gia tri da submit, dung de query
  const [page, setPage] = useState(1);

  // Danh muc cung tu dong cap nhat trong 1 giay khi Admin them/sua/xoa danh muc
  const { data: categoriesData } = useLiveData(
    async () => {
      const { data } = await api.get('/categories');
      return data.data;
    },
    [],
    3000
  );
  const categories = [{ slug: '', name: 'Tất cả' }, ...(categoriesData || [])];

  // San pham tu dong cap nhat theo dung bo loc hien tai (category/search/page)
  // moi 1 giay, giup Shop phan anh thay doi tu Admin gan nhu ngay lap tuc.
  const { data: productsData, isLoading } = useLiveData(
    async () => {
      const { data } = await api.get('/products', {
        params: { category: category || undefined, search: search || undefined, page, limit: 12 },
      });
      return { products: data.data, totalPages: data.pagination.totalPages };
    },
    [category, search, page],
    3000
  );

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-mist-100">Tất cả sản phẩm</h1>
      <p className="text-mist-400 mt-1">Tìm kiếm file, proxy, config, ... phù hợp với bạn</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm sản phẩm theo tên..."
            className="w-full rounded-full glass-input pl-11 pr-4 py-3 text-sm text-mist-100 placeholder:text-mist-500"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setCategory(cat.slug);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat.slug
                  ? 'bg-ember-gradient text-ink-950'
                  : 'border border-ink-600 text-mist-300 hover:border-ember-500/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-ink-800 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-mist-500 py-20">Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <ProductCard key={product._id} product={product} delay={idx * 0.15} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                page === i + 1 ? 'bg-ember-gradient text-ink-950' : 'border border-ink-600 text-mist-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
