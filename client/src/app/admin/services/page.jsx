'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiLoader, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiSave } from 'react-icons/fi';
import api from '../../../lib/api';
import { formatVND, formatDateTime } from '../../../lib/utils';

const TABS = [
  { key: 'features', label: 'Quản lý chức năng' },
  { key: 'orders', label: 'Đơn đặt dịch vụ' },
];

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-2">Đặt sản phẩm</h1>
      <p className="text-sm text-mist-400 mb-6">Quản lý danh sách chức năng khách chọn, và xử lý các đơn đã đặt.</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-ember-gradient text-ink-950' : 'border border-ink-600 text-mist-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'features' ? <FeaturesTab /> : <OrdersTab />}
    </div>
  );
}

function FeaturesTab() {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: '', price: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', price: '' });

  const fetchFeatures = () => {
    setIsLoading(true);
    api
      .get('/admin/service-features')
      .then(({ data }) => setFeatures(data.data))
      .catch(() => setFeatures([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const startEdit = (f) => {
    setEditingId(f._id);
    setDraft({ name: f.name, price: f.price });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/service-features/${id}`, { name: draft.name, price: Number(draft.price) });
      toast.success('Đã cập nhật.');
      setEditingId(null);
      fetchFeatures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const toggleActive = async (f) => {
    try {
      await api.put(`/admin/service-features/${f._id}`, { isActive: !f.isActive });
      fetchFeatures();
    } catch (error) {
      toast.error('Cập nhật thất bại.');
    }
  };

  const handleDelete = async (f) => {
    if (!confirm(`Xoá chức năng "${f.name}"?`)) return;
    try {
      await api.delete(`/admin/service-features/${f._id}`);
      toast.success('Đã xoá.');
      fetchFeatures();
    } catch (error) {
      toast.error('Xoá thất bại.');
    }
  };

  const handleAdd = async () => {
    if (!newFeature.name.trim() || newFeature.price === '') {
      toast.error('Vui lòng nhập tên và giá.');
      return;
    }
    try {
      await api.post('/admin/service-features', { name: newFeature.name, price: Number(newFeature.price) });
      toast.success('Đã thêm chức năng mới.');
      setNewFeature({ name: '', price: '' });
      setIsAdding(false);
      fetchFeatures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thêm thất bại.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><FiLoader className="animate-spin text-2xl text-ember-500" /></div>;
  }

  return (
    <div className="space-y-3">
      {features.map((f) => (
        <div key={f._id} className="rounded-xl border border-ink-700 bg-ink-800/40 p-4 flex items-center gap-3">
          {editingId === f._id ? (
            <>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="flex-1 rounded-lg glass-input px-3 py-2 text-sm text-mist-100"
              />
              <input
                type="number"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                className="w-28 rounded-lg glass-input px-3 py-2 text-sm text-mist-100"
              />
              <button onClick={() => saveEdit(f._id)} className="text-green-400 p-2"><FiSave /></button>
              <button onClick={() => setEditingId(null)} className="text-mist-400 p-2"><FiX /></button>
            </>
          ) : (
            <>
              <span className={`flex-1 text-sm font-medium ${f.isActive ? 'text-mist-100' : 'text-mist-600 line-through'}`}>
                {f.name}
              </span>
              <span className="text-sm text-gold-400 font-mono">{formatVND(f.price)}</span>
              <button
                onClick={() => toggleActive(f)}
                className={`text-xs px-2.5 py-1 rounded-full ${f.isActive ? 'bg-green-400/10 text-green-400' : 'bg-mist-600/10 text-mist-500'}`}
              >
                {f.isActive ? 'Đang bật' : 'Đã ẩn'}
              </button>
              <button onClick={() => startEdit(f)} className="text-mist-400 hover:text-mist-100 p-2"><FiEdit2 size={15} /></button>
              <button onClick={() => handleDelete(f)} className="text-red-400 hover:text-red-300 p-2"><FiTrash2 size={15} /></button>
            </>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="rounded-xl border border-ember-500/40 bg-ink-800/40 p-4 flex items-center gap-3">
          <input
            value={newFeature.name}
            onChange={(e) => setNewFeature((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tên chức năng"
            className="flex-1 rounded-lg glass-input px-3 py-2 text-sm text-mist-100"
          />
          <input
            type="number"
            value={newFeature.price}
            onChange={(e) => setNewFeature((f) => ({ ...f, price: e.target.value }))}
            placeholder="Giá"
            className="w-28 rounded-lg glass-input px-3 py-2 text-sm text-mist-100"
          />
          <button onClick={handleAdd} className="text-green-400 p-2"><FiSave /></button>
          <button onClick={() => setIsAdding(false)} className="text-mist-400 p-2"><FiX /></button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-ink-600 px-4 py-3 text-sm text-mist-400 hover:border-ember-500/50 hover:text-ember-400 w-full justify-center"
        >
          <FiPlus /> Thêm chức năng mới
        </button>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = () => {
    setIsLoading(true);
    api
      .get('/admin/service-orders', { params: { status: status || undefined, limit: 50 } })
      .then(({ data }) => setOrders(data.data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleComplete = async (order) => {
    setProcessingId(order._id);
    try {
      await api.patch(`/admin/service-orders/${order._id}/complete`);
      toast.success('Đã đánh dấu hoàn thành.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (order) => {
    const note = prompt('Lý do huỷ (sẽ hoàn tiền lại cho khách):', '');
    if (note === null) return;
    setProcessingId(order._id);
    try {
      await api.patch(`/admin/service-orders/${order._id}/cancel`, { note });
      toast.success('Đã huỷ và hoàn tiền.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { v: 'pending', l: 'Chờ xử lý' },
          { v: 'completed', l: 'Hoàn thành' },
          { v: 'cancelled', l: 'Đã huỷ' },
          { v: '', l: 'Tất cả' },
        ].map((s) => (
          <button
            key={s.v}
            onClick={() => setStatus(s.v)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              status === s.v ? 'bg-ember-gradient text-ink-950' : 'border border-ink-600 text-mist-300'
            }`}
          >
            {s.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><FiLoader className="animate-spin text-2xl text-ember-500" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-10 text-center text-mist-500">
          Không có đơn nào.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="rounded-2xl border border-ink-700 bg-ink-800/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-mist-100">
                    {o.device === 'ios' ? 'iOS' : 'Android'} - {formatVND(o.totalPrice)}
                  </p>
                  <p className="text-xs text-mist-500 mt-0.5">
                    Khách: {o.user?.username || 'N/A'} ({o.user?.email || 'N/A'})
                  </p>
                  <p className="text-xs text-mist-500">{formatDateTime(o.createdAt)}</p>
                  <p className="text-xs text-mist-400 mt-1">{o.features.map((f) => f.name).join(', ')}</p>
                </div>

                {o.status === 'pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleComplete(o)}
                      disabled={processingId === o._id}
                      className="flex items-center gap-1.5 rounded-xl bg-green-500/20 text-green-400 px-3.5 py-2 text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50"
                    >
                      <FiCheck /> Hoàn thành
                    </button>
                    <button
                      onClick={() => handleCancel(o)}
                      disabled={processingId === o._id}
                      className="flex items-center gap-1.5 rounded-xl bg-red-500/20 text-red-400 px-3.5 py-2 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                    >
                      <FiX /> Huỷ & hoàn tiền
                    </button>
                  </div>
                ) : (
                  <span
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${
                      o.status === 'completed' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                    }`}
                  >
                    {o.status === 'completed' ? 'Hoàn thành' : 'Đã huỷ'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
