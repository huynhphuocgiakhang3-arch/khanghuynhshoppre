'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiCopy, FiPackage } from 'react-icons/fi';
import { formatVND, formatDateTime, ORDER_STATUS_MAP } from '../../lib/utils';
import api from '../../lib/api';
import RequireAuth from '../../components/auth/RequireAuth';

function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/my-orders')
      .then(({ data }) => setOrders(data.data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopyLink = (link) => {
    // Link giao hang co dang "Ten SP - Ten file: https://..." -> chi copy phan URL
    const url = link.includes('http') ? link.slice(link.lastIndexOf('http')) : link;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link!');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-mist-100">Đơn hàng của tôi</h1>

      <div className="mt-8 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ink-800 animate-pulse" />)
        ) : orders.length === 0 ? (
          <p className="text-center text-mist-500 py-16">Bạn chưa có đơn hàng nào.</p>
        ) : (
          orders.map((order) => {
            const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: '' };
            return (
              <div key={order._id} className="rounded-2xl border border-ink-700 bg-ink-800/40 p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-sm text-mist-300">{order.orderCode}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-mist-300">
                        {item.name} <span className="text-mist-500">x{item.quantity}</span>
                      </span>
                      <span className="text-mist-200">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* File giao hang: hien thi ngay khi don da thanh toan thanh cong */}
                {order.status === 'paid' && order.deliveredFiles && order.deliveredFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-700">
                    <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1.5">
                      <FiPackage /> Sản phẩm của bạn
                    </p>
                    <div className="space-y-1.5">
                      {order.deliveredFiles.map((link, idx) => {
                        const url = link.includes('http') ? link.slice(link.lastIndexOf('http')) : link;
                        const label = link.includes(':') ? link.slice(0, link.lastIndexOf(':')) : link;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-lg bg-ink-900/60 px-3 py-2 text-xs"
                          >
                            <span className="text-mist-300 truncate">{label}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleCopyLink(link)}
                                className="p-1.5 rounded-md hover:bg-ink-700 text-mist-400"
                                title="Sao chép link"
                              >
                                <FiCopy size={13} />
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md hover:bg-ink-700 text-ember-400"
                                title="Tải xuống / Mở"
                              >
                                <FiDownload size={13} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-ink-700 flex justify-between items-center">
                  <span className="text-xs text-mist-500">{formatDateTime(order.createdAt)}</span>
                  <span className="font-display font-bold text-ember-500">{formatVND(order.totalAmount)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}
