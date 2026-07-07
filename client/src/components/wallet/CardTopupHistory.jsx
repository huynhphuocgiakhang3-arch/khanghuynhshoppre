'use client';

import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatVND } from '../../lib/utils';

const STATUS_MAP = {
  pending: { label: 'Chờ duyệt', color: 'text-gold-400 bg-gold-400/10', icon: FiClock },
  success: { label: 'Thành công', color: 'text-green-400 bg-green-400/10', icon: FiCheckCircle },
  failed: { label: 'Thất bại', color: 'text-red-400 bg-red-400/10', icon: FiXCircle },
};

export default function CardTopupHistory({ items, isLoading }) {
  if (isLoading) {
    return <p className="text-center text-mist-500 py-6 text-sm">Đang tải...</p>;
  }

  if (!items || items.length === 0) {
    return <p className="text-center text-mist-500 py-6 text-sm">Chưa có lần nạp thẻ nào.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
        const StatusIcon = status.icon;
        return (
          <div
            key={item._id}
            className="flex items-center justify-between rounded-xl border border-ink-700 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-mist-100">
                Thẻ {item.cardType} - {formatVND(item.amount)}
              </p>
              <p className="text-xs text-mist-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
              {item.status === 'failed' && item.adminNote && (
                <p className="text-xs text-red-400/80 mt-0.5">{item.adminNote}</p>
              )}
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.color}`}>
              <StatusIcon size={12} /> {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
