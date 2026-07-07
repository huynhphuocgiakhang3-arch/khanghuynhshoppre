'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiMessageSquare, FiSend, FiLoader, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import api from '../../lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zaloUrl, setZaloUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('support@khanghuynh.shop');

  useEffect(() => {
    api
      .get('/config/public')
      .then(({ data }) => {
        if (data.data.shopInfo?.zaloUrl) setZaloUrl(data.data.shopInfo.zaloUrl);
        if (data.data.shopInfo?.contactEmail) setContactEmail(data.data.shopInfo.contactEmail);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/contact', form);
      toast.success('Đã gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gửi liên hệ thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-radial-glow">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-mist-100">Liên hệ với chúng tôi</h1>
          <p className="mt-3 text-mist-400 max-w-xl mx-auto">
            Có thắc mắc về sản phẩm hoặc giao dịch? Gửi tin nhắn cho chúng tôi, đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Form Glassmorphism */}
          <div className="md:col-span-3 glass-panel rounded-2xl p-6 sm:p-8 shadow-glow">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-mist-300 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-mist-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100"
                      placeholder="ban@email.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Chủ đề</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full rounded-xl glass-input px-4 py-3 text-sm text-mist-100"
                  placeholder="Hỗ trợ đơn hàng, hợp tác, góp ý..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Nội dung</label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-4 top-3.5 text-mist-500" />
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full rounded-xl glass-input pl-11 pr-4 py-3 text-sm text-mist-100 resize-none"
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3.5 font-semibold text-ink-950 shadow-ember hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : (<><FiSend /> Gửi liên hệ</>)}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-display font-semibold text-mist-100 mb-1">Thông tin liên hệ</h3>
              <p className="text-sm text-mist-400">Liên hệ trực tiếp qua các kênh sau để được hỗ trợ nhanh nhất.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-ember-500/10 text-ember-400"><FiMail /></span>
                <div>
                  <p className="text-sm text-mist-100 font-medium">Email</p>
                  <p className="text-sm text-mist-400">{contactEmail}</p>
                </div>
              </div>

              {zaloUrl && (
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-ember-500/10 text-ember-400"><FiMessageCircle /></span>
                  <div>
                    <p className="text-sm text-mist-100 font-medium group-hover:text-ember-400">Zalo</p>
                    <p className="text-sm text-mist-400">Liên hệ trực tiếp qua Zalo</p>
                  </div>
                </a>
              )}

              <div className="flex items-start gap-3">
                <span className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-ember-500/10 text-ember-400"><FiMapPin /></span>
                <div>
                  <p className="text-sm text-mist-100 font-medium">Khu vực hoạt động</p>
                  <p className="text-sm text-mist-400">Toàn quốc - Giao dịch online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
