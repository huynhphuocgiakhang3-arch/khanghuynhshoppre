'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUsers, FiBox, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import StatCard from '../../components/admin/StatCard';
import RevenueChart from '../../components/admin/RevenueChart';
import api from '../../lib/api';
import { formatVND, formatDateTime, ORDER_STATUS_MAP } from '../../lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/dashboard/revenue-chart', { params: { days: 14 } }),
    ])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data.data);
        setChartData(chartRes.data.data);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Không thể tải dữ liệu Dashboard. Vui lòng thử lại.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-ink-800 animate-pulse" />)}
      </div>
    );
  }

  // Bao ve: neu API loi (vd: bi rate-limit tam thoi, mat mang...), stats co
  // the van la null sau khi isLoading da tat. Hien thong bao thay vi crash trang.
  if (!stats) {
    return (
      <div className="text-center py-20 text-mist-500">
        Không thể tải dữ liệu Dashboard. Vui lòng tải lại trang.
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-6">Tổng quan</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={FiDollarSign} label="Tổng doanh thu" value={formatVND(stats.totalRevenue)} accent="ember" subtext={`Hôm nay: ${formatVND(stats.todayRevenue)}`} />
        <StatCard icon={FiShoppingBag} label="Tổng đơn hàng" value={stats.totalPaidOrders} accent="gold" subtext={`Hôm nay: ${stats.todayOrders} đơn`} />
        <StatCard icon={FiUsers} label="Người dùng" value={stats.totalUsers} accent="blue" />
        <StatCard icon={FiBox} label="Sản phẩm" value={stats.totalProducts} accent="green" subtext={`${stats.pendingDeposits} lệnh nạp đang chờ`} />
      </div>

      <div className="mt-6">
        <RevenueChart data={chartData} />
      </div>

      <div className="mt-6 rounded-2xl border border-ink-700 bg-ink-800/40 p-5">
        <h3 className="font-display font-semibold text-mist-100 mb-4">Đơn hàng gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 border-b border-ink-700">
                <th className="py-2 pr-4">Mã đơn</th>
                <th className="py-2 pr-4">Khách hàng</th>
                <th className="py-2 pr-4">Tổng tiền</th>
                <th className="py-2 pr-4">Trạng thái</th>
                <th className="py-2 pr-4">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => {
                const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: '' };
                return (
                  <tr key={order._id} className="border-b border-ink-700/50">
                    <td className="py-3 pr-4 font-mono text-mist-300">{order.orderCode}</td>
                    <td className="py-3 pr-4 text-mist-200">{order.user?.username || '—'}</td>
                    <td className="py-3 pr-4 text-mist-200">{formatVND(order.totalAmount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                    </td>
                    <td className="py-3 pr-4 text-mist-500">{formatDateTime(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
