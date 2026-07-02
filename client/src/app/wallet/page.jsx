'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiCreditCard } from 'react-icons/fi';
import DepositQRModal from '../../components/wallet/DepositQRModal';
import CardTopupModal from '../../components/wallet/CardTopupModal';
import CardTopupHistory from '../../components/wallet/CardTopupHistory';
import TransactionHistory from '../../components/wallet/TransactionHistory';
import api from '../../lib/api';
import { formatVND } from '../../lib/utils';
import { useAuthStore } from '../../context/useAuthStore';
import RequireAuth from '../../components/auth/RequireAuth';

function WalletContent() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardTopups, setCardTopups] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/wallet/transactions', { params: { limit: 30 } });
      setTransactions(data.data);
    } catch (error) {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardTopups = async () => {
    setIsLoadingCards(true);
    try {
      const { data } = await api.get('/wallet/card-topup/mine');
      setCardTopups(data.data);
    } catch (error) {
      setCardTopups([]);
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCardTopups();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-mist-100">Ví của tôi</h1>

      <div className="mt-6 rounded-2xl bg-ember-gradient p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-ink-950/70 text-sm font-medium flex items-center gap-1.5">
              <FiCreditCard /> Số dư hiện tại
            </p>
            <p className="font-display font-extrabold text-3xl sm:text-4xl text-ink-950 mt-2">
              {formatVND(user?.balance)}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2 rounded-full bg-ink-950 text-white px-5 py-3 font-semibold shadow-lg hover:bg-ink-900 transition-colors"
            >
              <FiPlus /> Nạp tiền QR
            </button>
            <button
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-2 rounded-full border border-ink-950/40 bg-white/10 text-ink-950 px-5 py-2.5 font-semibold hover:bg-white/20 transition-colors"
            >
              <FiCreditCard /> Nạp thẻ cào
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display font-semibold text-xl text-mist-100 mb-4">Lịch sử nạp thẻ cào</h2>
        <CardTopupHistory items={cardTopups} isLoading={isLoadingCards} />
      </div>

      <div className="mt-10">
        <h2 className="font-display font-semibold text-xl text-mist-100 mb-4">Lịch sử giao dịch</h2>
        <TransactionHistory transactions={transactions} isLoading={isLoading} />
      </div>

      {showDepositModal && (
        <DepositQRModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={fetchTransactions}
        />
      )}

      {showCardModal && (
        <CardTopupModal
          onClose={() => setShowCardModal(false)}
          onSuccess={fetchCardTopups}
        />
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <RequireAuth>
      <WalletContent />
    </RequireAuth>
  );
}
