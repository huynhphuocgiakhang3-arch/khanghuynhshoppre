'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiLoader, FiCheck, FiX, FiImage } from 'react-icons/fi';
import api from '../../../lib/api';
import { formatVND, formatDateTime } from '../../../lib/utils';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'success', label: 'Đã duyệt' },
  { value: 'failed', label: 'Đã từ chối' },
  { value: '', label: 'Tất cả' },
];

export default function AdminDepositsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchItems = () => {
    setIsLoading(true);
    api
      .get('/admin/deposits', { params: { status: status || undefined, limit: 50 } })
      .then(({ data }) => setItems(data.data))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (item) => {
    if (!confirm(`Duyệt nạp ${formatVND(item.amount)} cho user "${item.user?.username}"? Số dư sẽ được cộng ngay.`)) return;
    setProcessingId(item._id);
    try {
      await api.patch(`/admin/deposits/${item._id}/approve`);
      toast.success('Đã duyệt và cộng tiền cho khách.');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Duyệt thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item) => {
    const note = prompt('Lý do từ chối (không bắt buộc):', 'Ảnh xác nhận không hợp lệ hoặc không khớp số tiền.');
    if (note === null) return;
    setProcessingId(item._id);
    try {
      await api.patch(`/admin/deposits/${item._id}/reject`, { note });
      toast.success('Đã từ chối lệnh nạp.');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Từ chối thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-2">Duyệt nạp QR (bill chuyển khoản)</h1>
      <p className="text-sm text-mist-400 mb-6">
        Đối chiếu bill khách gửi với sao kê ngân hàng trước khi duyệt. Duyệt thành công sẽ cộng tiền ngay lập tức, không thể hoàn tác.
      </p>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === f.value ? 'bg-ember-gradient text-ink-950' : 'border border-ink-600 text-mist-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><FiLoader className="animate-spin text-2xl text-ember-500" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-10 text-center text-mist-500">
          <FiImage className="mx-auto mb-2" size={24} />
          Không có lệnh nạp nào ở trạng thái này.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
              <button
                onClick={() => item.proofImage && setPreviewImage(item.proofImage)}
                className="relative block w-full aspect-[4/3] bg-ink-900"
              >
                {item.proofImage ? (
                  <Image src={item.proofImage} alt="Bill chuyển khoản" fill className="object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-mist-600">Chưa có bill</div>
                )}
              </button>

              <div className="p-4">
                <p className="text-sm font-semibold text-mist-100">{formatVND(item.amount)}</p>
                <p className="text-xs text-mist-500 mt-0.5">
                  Khách: {item.user?.username || 'N/A'} ({item.user?.email || 'N/A'})
                </p>
                <p className="text-xs text-mist-500 font-mono">ND CK: {item.transferContent}</p>
                <p className="text-xs text-mist-500">{formatDateTime(item.createdAt)}</p>

                {item.status === 'pending' ? (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={processingId === item._id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-500/20 text-green-400 px-3 py-2 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50"
                    >
                      <FiCheck /> Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      disabled={processingId === item._id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/20 text-red-400 px-3 py-2 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                    >
                      <FiX /> Từ chối
                    </button>
                  </div>
                ) : (
                  <span
                    className={`inline-block mt-3 text-xs font-semibold px-3 py-1.5 rounded-full ${
                      item.status === 'success' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                    }`}
                  >
                    {item.status === 'success' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                )}

                {item.status === 'failed' && item.note && (
                  <p className="mt-2 text-xs text-red-400/80">Lý do: {item.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-950/95 backdrop-blur-md p-6"
        >
          <div className="relative w-full max-w-lg aspect-[3/4]">
            <Image src={previewImage} alt="Bill chuyển khoản phóng to" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
