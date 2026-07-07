'use client';

import { FiArrowUpCircle, FiArrowDownCircle, FiSettings } from 'react-icons/fi';
import { formatVND, formatDateTime, TX_TYPE_MAP } from '../../lib/utils';

const STATUS_BADGE = {
  pending: 'text-gold-500 bg-gold-500/10',
  success: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
  cancelled: 'text-mist-400 bg-mist-400/10',
};

const STATUS_LABEL = {
  pending: 'Đang chờ',
  success: 'Thành công',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

export default function TransactionHistory({ transactions = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="text-center text-mist-500 py-12">Chưa có giao dịch nào.</p>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isPositive = tx.amount > 0;
        const typeInfo = TX_TYPE_MAP[tx.type] || { label: tx.type };
        const Icon = tx.type === 'admin_adjust' ? FiSettings : isPositive ? FiArrowUpCircle : FiArrowDownCircle;

        return (
          <div
            key={tx._id}
            className="flex items-center justify-between gap-3 rounded-xl border border-ink-700 bg-ink-800/40 p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-mist-100">{typeInfo.label}</p>
                <p className="text-xs text-mist-500">{formatDateTime(tx.createdAt)}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={`font-display font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}
                {formatVND(tx.amount)}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[tx.status]}`}>
                {STATUS_LABEL[tx.status]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
