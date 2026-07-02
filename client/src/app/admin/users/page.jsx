'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDollarSign, FiKey, FiLock, FiUnlock, FiTrash2, FiSearch } from 'react-icons/fi';
import AdjustBalanceModal from '../../../components/admin/AdjustBalanceModal';
import api from '../../../lib/api';
import { formatVND, formatDateTime } from '../../../lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustingUser, setAdjustingUser] = useState(null);

  const fetchUsers = async (searchTerm = search) => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search: searchTerm || undefined, limit: 50 } });
      setUsers(data.data);
    } catch (error) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = async (user) => {
    if (!confirm(`Reset mật khẩu cho "${user.username}"? Mật khẩu mới sẽ được hiển thị 1 lần duy nhất.`)) return;
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/reset-password`);
      alert(`Mật khẩu mới cho ${user.username}:\n\n${data.data.tempPassword}\n\nVui lòng gửi cho người dùng qua kênh an toàn.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset mật khẩu thất bại.');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    if (!confirm(`${newStatus === 'banned' ? 'Khóa' : 'Mở khóa'} tài khoản "${user.username}"?`)) return;
    try {
      await api.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      toast.success(`Đã ${newStatus === 'banned' ? 'khóa' : 'mở khóa'} tài khoản.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Xóa vĩnh viễn tài khoản "${user.username}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('Đã xóa tài khoản.');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-6">Quản lý người dùng</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchUsers();
        }}
        className="relative mb-5 max-w-sm"
      >
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo username hoặc email..."
          className="w-full rounded-full glass-input pl-11 pr-4 py-2.5 text-sm text-mist-100"
        />
      </form>

      <div className="rounded-2xl border border-ink-700 bg-ink-800/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 border-b border-ink-700 bg-ink-900/50">
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Số dư</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-mist-500">Không tìm thấy người dùng.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-ink-700/50">
                    <td className="py-3 px-4">
                      <p className="text-mist-100 font-medium">{user.username}</p>
                      <p className="text-xs text-mist-500">{user.email}</p>
                    </td>
                    <td className="py-3 px-4 text-gold-500 font-medium">{formatVND(user.balance)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'text-gold-500 bg-gold-500/10' : 'text-mist-400 bg-mist-400/10'}`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-mist-500">{formatDateTime(user.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => setAdjustingUser(user)} title="Điều chỉnh số dư" className="p-2 rounded-lg hover:bg-ink-700 text-ember-400">
                          <FiDollarSign size={15} />
                        </button>
                        <button onClick={() => handleResetPassword(user)} title="Reset mật khẩu" className="p-2 rounded-lg hover:bg-ink-700 text-blue-400">
                          <FiKey size={15} />
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            <button onClick={() => handleToggleStatus(user)} title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'} className="p-2 rounded-lg hover:bg-ink-700 text-gold-500">
                              {user.status === 'active' ? <FiLock size={15} /> : <FiUnlock size={15} />}
                            </button>
                            <button onClick={() => handleDelete(user)} title="Xóa tài khoản" className="p-2 rounded-lg hover:bg-ink-700 text-red-400">
                              <FiTrash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjustingUser && (
        <AdjustBalanceModal
          user={adjustingUser}
          onClose={() => setAdjustingUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
