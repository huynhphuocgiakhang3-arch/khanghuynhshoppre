'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiX, FiCreditCard, FiLoader, FiClock, FiImage, FiTrash2 } from 'react-icons/fi';
import api from '../../lib/api';

const CARD_TYPES = ['Viettel', 'Mobifone', 'Vinaphone', 'Vietnamobile', 'Zing', 'Garena', 'Gate', 'Khác'];
const AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000];

const EMPTY_FORM = { cardType: '', amount: '', serial: '', code: '' };

/**
 * Nap tien bang the cao - GUI DE ADMIN DUYET THU CONG. Sau khi gui, khach
 * thay dung trang thai "Dang cho duyet" that (khong hien thong bao loi gia
 * hay reset am tham lay du lieu) - minh bach de khach yen tam theo doi.
 *
 * Anh chup the (mat truoc/sau) la TUY CHON - giup Admin doi chieu truc quan
 * hon, giam ty le duyet nham/tu choi oan the that.
 */
export default function CardTopupModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ảnh tối đa 8MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cardType || !form.amount || !form.serial.trim() || !form.code.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin thẻ.');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload = form;
      let requestConfig;

      // Chi dung FormData (multipart) khi co dinh kem anh.
      //
      // FIX LOI QUAN TRONG: axios instance `api` (xem lib/api.js) da duoc
      // tao san voi header mac dinh "Content-Type: application/json". Neu
      // gui FormData ma KHONG ghi de header nay, axios/trinh duyet se GIU
      // NGUYEN "application/json" (khong tu chuyen sang multipart), khien
      // server KHONG parse duoc file dinh kem - day chinh la ly do anh the
      // cao truoc day khong bao gio toi duoc server (req.file luon undefined
      // du khach da chon anh).
      //
      // Cach fix DUNG: set header thanh `undefined` (khong phai xoa key hay
      // bo qua) - axios se tu loai bo hoan toan header nay khoi request, de
      // trinh duyet TU DIEN day du "multipart/form-data; boundary=..." dung
      // chuan khi thay body la FormData.
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => fd.append(key, value));
        fd.append('file', imageFile);
        payload = fd;
        requestConfig = { headers: { 'Content-Type': undefined } };
      }

      const { data } = await api.post('/wallet/card-topup', payload, requestConfig);
      toast.success(data.message || 'Đã gửi thẻ, đang chờ Admin duyệt.');
      setForm(EMPTY_FORM);
      handleRemoveImage();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi thẻ thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/90 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 font-display font-semibold text-lg text-mist-100">
              <FiCreditCard className="text-ember-400" /> Nạp tiền bằng thẻ cào
            </h3>
            <button onClick={onClose} className="text-mist-400 hover:text-mist-100">
              <FiX size={20} />
            </button>
          </div>

          <div className="rounded-xl bg-gold-500/10 border border-gold-500/30 p-3 text-xs text-gold-400 mb-4 flex items-start gap-2">
            <FiClock className="shrink-0 mt-0.5" />
            Thẻ sẽ được Admin kiểm tra thủ công. Nếu hợp lệ, số dư sẽ được cộng đúng bằng mệnh giá thẻ trong ít phút; bạn có thể theo dõi trạng thái trong lịch sử nạp thẻ bên dưới.
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Loại thẻ cào</label>
              <select
                name="cardType"
                value={form.cardType}
                onChange={handleChange}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              >
                <option value="" className="bg-ink-800">-- Chọn loại thẻ --</option>
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-ink-800">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Mệnh giá</label>
              <select
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              >
                <option value="" className="bg-ink-800">-- Chọn mệnh giá --</option>
                {AMOUNTS.map((a) => (
                  <option key={a} value={a} className="bg-ink-800">{a.toLocaleString('vi-VN')}đ</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Số seri</label>
              <input
                type="text"
                name="serial"
                value={form.serial}
                onChange={handleChange}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                placeholder="Nhập số seri trên thẻ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">Mã thẻ</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                placeholder="Nhập mã thẻ (cào lớp bạc)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-mist-300 mb-1.5">
                Ảnh chụp thẻ <span className="text-mist-500 font-normal">(không bắt buộc)</span>
              </label>
              {imagePreview ? (
                <div className="relative w-fit">
                  <img src={imagePreview} alt="Xem trước ảnh thẻ" className="h-28 w-auto rounded-xl border border-ink-600 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white"
                    title="Xóa ảnh"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-ink-600 py-4 text-sm text-mist-400 cursor-pointer hover:border-ember-500 hover:text-ember-400 transition-colors">
                  <FiImage /> Đính kèm ảnh chụp thẻ (giúp duyệt nhanh hơn)
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCreditCard />}
              {isSubmitting ? 'Đang gửi...' : 'Nạp thẻ'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
