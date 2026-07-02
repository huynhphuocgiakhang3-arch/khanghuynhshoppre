'use client';

import { useEffect, useState } from 'react';
import { formatVND, formatDateTime, ORDER_STATUS_MAP } from '../../../lib/utils';
import api from '../../../lib/api';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'pending', label: 'Đang xử lý' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'failed', label: 'Thất bại' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api
      .get('/admin/orders', { params: { status: status || undefined, limit: 50 } })
      .then(({ data }) => setOrders(data.data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [status]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-6">Quản lý đơn hàng</h1>

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

      <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 border-b border-ink-700 bg-ink-900/50">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Đang tải...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Không có đơn hàng nào.</td></tr>
              ) : (
                orders.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: '' };
                  return (
                    <tr key={order._id} className="border-b border-ink-700/50">
                      <td className="py-3 px-4 font-mono text-mist-300">{order.orderCode}</td>
                      <td className="py-3 px-4 text-mist-200">{order.user?.username || '—'} <br /><span className="text-xs text-mist-500">{order.user?.email}</span></td>
                      <td className="py-3 px-4 text-mist-400 max-w-[220px] truncate">{order.items.map((i) => i.name).join(', ')}</td>
                      <td className="py-3 px-4 text-mist-200">{formatVND(order.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                      </td>
                      <td className="py-3 px-4 text-mist-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
