'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVND } from '../../lib/utils';

export default function RevenueChart({ data = [] }) {
  const chartData = data.map((d) => ({
    date: d._id.slice(5), // MM-DD
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-5">
      <h3 className="font-display font-semibold text-mist-100 mb-4">Doanh thu 14 ngày gần nhất</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis dataKey="date" stroke="#71708a" fontSize={12} />
          <YAxis stroke="#71708a" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            contentStyle={{ background: '#161620', border: '1px solid #2a2a3d', borderRadius: 8 }}
            labelStyle={{ color: '#f4f3f7' }}
            formatter={(value, name) => [name === 'revenue' ? formatVND(value) : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']}
          />
          <Line type="monotone" dataKey="revenue" stroke="#ff5722" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
