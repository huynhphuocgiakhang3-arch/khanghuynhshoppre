'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiVideo } from 'react-icons/fi';
import ProductFormModal from '../../../components/admin/ProductFormModal';
import api from '../../../lib/api';
import { formatVND } from '../../../lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/products', { params: { limit: 50 } });
      setProducts(data.data);
    } catch (error) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (product) => {
    if (!confirm(`Xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/products/${product._id}`);
      toast.success('Đã xóa sản phẩm.');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-mist-100">Quản lý sản phẩm</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-full bg-ember-gradient px-5 py-2.5 text-sm font-semibold text-ink-950"
        >
          <FiPlus /> Thêm sản phẩm
        </button>
      </div>

      <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 border-b border-ink-700 bg-ink-900/50">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4">Giá</th>
                <th className="py-3 px-4">Kho</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Đang tải...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Chưa có sản phẩm nào.</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-ink-700/50">
                    <td className="py-3 px-4 text-mist-100 font-medium max-w-[220px] truncate">
                      <span className="inline-flex items-center gap-1.5">
                        {product.name}
                        {product.testVideoUrl && (
                          <FiVideo className="text-ember-400 shrink-0" size={13} title="Có video test" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-mist-400">{product.category}</td>
                    <td className="py-3 px-4 text-mist-200">{formatVND(product.salePrice ?? product.price)}</td>
                    <td className="py-3 px-4 text-mist-200">{product.stock}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive ? 'text-green-400 bg-green-400/10' : 'text-mist-400 bg-mist-400/10'}`}>
                        {product.isActive ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-ink-700 text-mist-300"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-2 rounded-lg hover:bg-ink-700 text-red-400">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}
