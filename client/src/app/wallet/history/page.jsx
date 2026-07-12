'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '../../../components/auth/RequireAuth';
import TransactionHistory from '../../../components/wallet/TransactionHistory';
import CardTopupHistory from '../../../components/wallet/CardTopupHistory';
import api from '../../../lib/api';

export default function WalletHistoryPage() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}

function HistoryContent() {
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [cardTopups, setCardTopups] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  useEffect(() => {
    api
      .get('/wallet/transactions', { params: { limit: 50 } })
      .then(({ data }) => setTransactions(data.data))
      .catch(() => setTransactions([]))
      .finally(() => setIsLoadingTx(false));

    api
      .get('/wallet/card-topup/mine')
      .then(({ data }) => setCardTopups(data.data))
      .catch(() => setCardTopups([]))
      .finally(() => setIsLoadingCards(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-mist-100 mb-8">Lịch sử giao dịch</h1>

      <div className="mb-10">
        <h2 className="font-display font-semibold text-lg text-mist-100 mb-4">Nạp thẻ cào</h2>
        <CardTopupHistory items={cardTopups} isLoading={isLoadingCards} />
      </div>

      <div>
        <h2 className="font-display font-semibold text-lg text-mist-100 mb-4">Ví & thanh toán</h2>
        <TransactionHistory transactions={transactions} isLoading={isLoadingTx} />
      </div>
    </div>
  );
}
