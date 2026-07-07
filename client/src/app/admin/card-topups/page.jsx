'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiCheck, FiX, FiCreditCard } from 'react-icons/fi';
import api from '../../../lib/api';
import { formatVND, formatDateTime } from '../../../lib/utils';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'success', label: 'Đã duyệt' },
  { value: 'failed', label: 'Đã từ chối' },
  { value: '', label: 'Tất cả' },
];

export default function AdminCardTopupsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const fetchItems = () => {
    setIsLoading(true);
    api
      .get('/admin/card-topups', { params: { status: status || undefined, limit: 50 } })
      .then(({ data }) => setItems(data.data))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (item) => {
    if (!confirm(`Duyệt thẻ ${item.cardType} ${formatVND(item.amount)} cho user "${item.user?.username}"? Số dư sẽ được cộng ngay.`)) return;
    setProcessingId(item._id);
    try {
      await api.patch(`/admin/card-topups/${item._id}/approve`);
      toast.success('Đã duyệt và cộng tiền cho khách.');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Duyệt thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item) => {
    const note = prompt('Lý do từ chối (không bắt buộc):', 'Thẻ không hợp lệ hoặc đã qua sử dụng.');
    if (note === null) return; // bấm Hủy trên prompt
    setProcessingId(item._id);
    try {
      await api.patch(`/admin/card-topups/${item._id}/reject`, { note });
      toast.success('Đã từ chối thẻ.');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Từ chối thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-2">Duyệt thẻ cào</h1>
      <p className="text-sm text-mist-400 mb-6">
        Kiểm tra seri/mã trên hệ thống của bạn trước khi bấm duyệt. Duyệt thành công sẽ cộng tiền ngay lập tức, không thể hoàn tác.
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
          <FiCreditCard className="mx-auto mb-2" size={24} />
          Không có thẻ nào ở trạng thái này.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink-700 bg-ink-800/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-mist-100">
                    {item.cardType} - {formatVND(item.amount)}
                  </p>
                  <p className="text-xs text-mist-500 mt-0.5">
                    Khách: {item.user?.username || 'N/A'} ({item.user?.email || 'N/A'})
                  </p>
                  <p className="text-xs text-mist-500">{formatDateTime(item.createdAt)}</p>
                </div>

                {item.status === 'pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={processingId === item._id}
                      className="flex items-center gap-1.5 rounded-xl bg-green-500/20 text-green-400 px-3.5 py-2 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50"
                    >
                      <FiCheck /> Duyệt thành công
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      disabled={processingId === item._id}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500/20 text-red-400 px-3.5 py-2 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                    >
                      <FiX /> Từ chối
                    </button>
                  </div>
                ) : (
                  <span
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${
                      item.status === 'success' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                    }`}
                  >
                    {item.status === 'success' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-ink-900/60 px-3 py-2">
                  <p className="text-mist-500">Số seri</p>
                  <p className="text-mist-200 font-mono">{item.serial}</p>
                </div>
                <div className="rounded-lg bg-ink-900/60 px-3 py-2">
                  <p className="text-mist-500">Mã thẻ</p>
                  <p className="text-mist-200 font-mono">{item.code}</p>
                </div>
              </div>

              {item.cardImage && (
                <a
                  href={item.cardImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-fit"
                  title="Bấm để xem ảnh cỡ lớn"
                >
                  <img
                    src={item.cardImage}
                    alt="Ảnh thẻ cào"
                    className="h-24 w-auto rounded-lg border border-ink-600 object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              )}

              {item.status === 'failed' && item.adminNote && (
                <p className="mt-2 text-xs text-red-400/80">Lý do: {item.adminNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
