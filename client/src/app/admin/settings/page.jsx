'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiLoader, FiSave, FiCopy, FiPlus, FiTrash2, FiEdit2, FiX, FiUpload } from 'react-icons/fi';
import api from '../../../lib/api';

const TABS = [
  { key: 'bank', label: 'Ngân hàng MB Bank' },
  { key: 'gateway', label: 'Cổng thanh toán' },
  { key: 'telegram', label: 'Telegram Bot' },
  { key: 'announcement', label: 'Thông báo shop' },
  { key: 'popupAnnouncement', label: 'Thông báo popup' },
  { key: 'shopInfo', label: 'Thông tin shop' },
  { key: 'depositLimits', label: 'Hạn mức nạp' },
  { key: 'categories', label: 'Danh mục sản phẩm' },
  { key: 'music', label: 'Nhạc nền' },
  { key: 'security', label: 'Bảo mật' },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('bank');
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customQrImage, setCustomQrImage] = useState('');
  const [customQrImagePublicId, setCustomQrImagePublicId] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [popupImage, setPopupImage] = useState('');
  const [isUploadingPopupImage, setIsUploadingPopupImage] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null); // { ok: boolean, message: string }
  const [isCheckingTotp, setIsCheckingTotp] = useState(false);
  const [totpDebugResult, setTotpDebugResult] = useState(null);
  const [isCheckingIp, setIsCheckingIp] = useState(false);
  const [ipDebugResult, setIpDebugResult] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/config');
      setConfig(data.data);
      setCustomQrImage(data.data.bank?.customQrImage || '');
      setCustomQrImagePublicId(data.data.bank?.customQrImagePublicId || '');
      setPopupImage(data.data.popupAnnouncement?.imageUrl || '');
    } catch (error) {
      toast.error('Không thể tải cấu hình.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'telegram') {
      api
        .get('/admin/telegram/status')
        .then(({ data }) => setTelegramStatus(data.data))
        .catch(() => setTelegramStatus(null));
    }
  }, [activeTab]);

  /** Admin tu upload anh QR that (vd chup tu app ngan hang) de thay the QR sinh tu dong */
  const handleUploadQrImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/admin/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCustomQrImage(data.data.url);
      setCustomQrImagePublicId(data.data.publicId);
      toast.success('Đã tải ảnh QR lên, nhớ bấm Lưu để áp dụng.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại.');
    } finally {
      setIsUploadingQr(false);
      e.target.value = '';
    }
  };

  const handleUploadPopupImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPopupImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/admin/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPopupImage(data.data.url);
      toast.success('Đã tải ảnh lên, nhớ bấm Lưu để áp dụng.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại.');
    } finally {
      setIsUploadingPopupImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveQrImage = () => {
    setCustomQrImage('');
    setCustomQrImagePublicId('');
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const { data } = await api.post('/admin/telegram/test');
      setTelegramTestResult({ ok: true, message: data.message });
    } catch (error) {
      setTelegramTestResult({ ok: false, message: error.response?.data?.message || 'Không thể kết nối tới server.' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Goi qua instance `api` da co san (tu dinh kem token dang nhap), thay vi
  // mo link tren thanh dia chi trinh duyet (cach do KHONG gui kem token nen
  // luon bao "chua dang nhap" du ban da dang nhap o tab khac).
  const handleCheckTotp = async () => {
    setIsCheckingTotp(true);
    setTotpDebugResult(null);
    try {
      const { data } = await api.get('/admin/debug-totp');
      setTotpDebugResult(data);
    } catch (error) {
      setTotpDebugResult({ success: false, message: error.response?.data?.message || 'Không thể kết nối tới server.' });
    } finally {
      setIsCheckingTotp(false);
    }
  };

  const handleCheckIp = async () => {
    setIsCheckingIp(true);
    setIpDebugResult(null);
    try {
      const { data } = await api.get('/my-ip');
      setIpDebugResult(data);
    } catch (error) {
      setIpDebugResult({ success: false, message: error.response?.data?.message || 'Không thể kết nối tới server.' });
    } finally {
      setIsCheckingIp(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  if (isLoading || !config) {
    return <div className="flex justify-center py-20"><FiLoader className="animate-spin text-2xl text-ember-500" /></div>;
  }

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        bin: form.get('bin'),
        bankName: form.get('bankName'),
        accountNo: form.get('accountNo'),
        accountName: form.get('accountName'),
        template: form.get('template'),
        depositNote: form.get('depositNote'),
        customQrImage,
        customQrImagePublicId,
      };
      await api.put('/admin/config/bank', payload);
      toast.success('Đã lưu cấu hình ngân hàng.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        provider: form.get('provider'),
        apiKey: form.get('apiKey'),
        webhookSecret: form.get('webhookSecret'),
        isEnabled: form.get('isEnabled') === 'on',
      };
      const { data } = await api.put('/admin/config/payment-gateway', payload);
      setWebhookUrl(data.data.webhookUrl);
      toast.success('Đã lưu cấu hình cổng thanh toán.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        isActive: form.get('isActive') === 'on',
        content: form.get('content'),
        type: form.get('type'),
      };
      await api.put('/admin/config/announcement', payload);
      toast.success('Đã lưu thông báo.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePopupAnnouncement = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        isActive: form.get('isActive') === 'on',
        title: form.get('title'),
        content: form.get('content'),
        imageUrl: popupImage,
      };
      await api.put('/admin/config/popup-announcement', payload);
      toast.success('Đã lưu thông báo popup. Nội dung mới sẽ hiện lại cho khách kể cả người đã từng đóng thông báo trước đó.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShopInfo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        shopName: form.get('shopName'),
        contactEmail: form.get('contactEmail'),
        zaloUrl: form.get('zaloUrl'),
      };
      await api.put('/admin/config/shop-info', payload);
      toast.success('Đã lưu thông tin shop.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDepositLimits = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        minAmount: Number(form.get('minAmount')),
        maxAmount: Number(form.get('maxAmount')),
      };
      await api.put('/admin/config/deposit-limits', payload);
      toast.success('Đã lưu hạn mức nạp tiền.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMusic = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = new FormData(e.target);
      const payload = {
        isEnabled: form.get('isEnabled') === 'on',
        musicUrl: form.get('musicUrl'),
        title: form.get('title'),
        volume: Number(form.get('volume')),
      };
      await api.put('/admin/config/music', payload);
      toast.success('Đã lưu cấu hình nhạc nền.');
      fetchConfig();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-100 mb-6">Cấu hình hệ thống</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-ember-gradient text-ink-950' : 'border border-ink-600 text-mist-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'categories' ? (
        <CategoryManager />
      ) : (
        <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-6 max-w-2xl">
          {activeTab === 'bank' && (
            <form onSubmit={handleSaveBank} className="space-y-4">
              <p className="text-sm text-mist-400 mb-2">
                Thông tin tài khoản MB Bank dùng để tạo mã QR động cho khách hàng nạp tiền (chuẩn VietQR/Napas, quét được bằng mọi app ngân hàng).
              </p>
              <Field label="Mã BIN ngân hàng (theo chuẩn Napas)" name="bin" defaultValue={config.bank.bin} placeholder="970422 (MB Bank)" />
              <Field label="Tên ngân hàng" name="bankName" defaultValue={config.bank.bankName} placeholder="MB Bank" />
              <Field label="Số tài khoản" name="accountNo" defaultValue={config.bank.accountNo} />
              <Field label="Tên chủ tài khoản (KHÔNG DẤU)" name="accountName" defaultValue={config.bank.accountName} />
              <Field label="Template hiển thị QR" name="template" defaultValue={config.bank.template} placeholder="compact2" />

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">
                  Ảnh QR tùy chỉnh <span className="text-mist-500">(nếu có, sẽ thay thế QR tự sinh)</span>
                </label>
                {customQrImage ? (
                  <div className="relative w-40 mb-2 rounded-xl overflow-hidden border border-ink-600 bg-white">
                    <Image src={customQrImage} alt="QR tùy chỉnh" width={160} height={160} className="object-contain" unoptimized />
                    <button
                      type="button"
                      onClick={handleRemoveQrImage}
                      className="absolute top-1.5 right-1.5 rounded-full bg-ink-950/80 p-1.5 text-red-400 border border-ink-600"
                      aria-label="Xóa ảnh QR"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadQrImage}
                  className="hidden"
                  id="custom-qr-upload"
                />
                <label
                  htmlFor="custom-qr-upload"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 cursor-pointer hover:border-ember-500/50"
                >
                  {isUploadingQr ? <FiLoader className="animate-spin" /> : <FiUpload />}
                  {isUploadingQr ? 'Đang tải lên...' : customQrImage ? 'Đổi ảnh QR khác' : 'Tải ảnh QR lên'}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">
                  Ghi chú hiển thị dưới mã QR khi khách nạp tiền
                </label>
                <textarea
                  name="depositNote"
                  defaultValue={config.bank.depositNote}
                  rows={2}
                  placeholder="Nếu chuyển tiền rồi mà vẫn không cộng số dư liên hệ Zalo admin để được hỗ trợ nhé"
                  className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 resize-none"
                />
              </div>
              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'telegram' && (
            <div className="space-y-4">
              <p className="text-sm text-mist-400">
                Bot Telegram gửi thông báo cho bạn khi có thẻ cào hoặc bill chuyển khoản mới cần duyệt. Cấu hình{' '}
                <code className="text-gold-400">TELEGRAM_BOT_TOKEN</code> và{' '}
                <code className="text-gold-400">TELEGRAM_CHAT_ID</code> được đặt trong biến môi trường (.env) trên server, không lưu trong database.
              </p>

              <div className="rounded-xl bg-gold-500/10 border border-gold-500/30 p-4 text-xs text-gold-400 space-y-1.5">
                <p className="font-semibold">Nếu bấm test mà không nhận được tin nhắn, kiểm tra theo thứ tự:</p>
                <p>1. Bạn đã tự nhắn tin (hoặc bấm Start) cho bot của mình trên Telegram chưa? Bot không thể chủ động nhắn cho người chưa từng chat với nó.</p>
                <p>2. TELEGRAM_CHAT_ID có đúng là ID Telegram của bạn không (số, không phải username)?</p>
                <p>3. Nếu server chạy trên Render/Railway/VPS... biến môi trường phải được khai báo trên đó, không chỉ trong file .env local - và cần redeploy/restart sau khi thêm.</p>
              </div>

              <div className="rounded-xl border border-ink-600 p-4 text-xs space-y-1.5">
                <p className="font-semibold text-mist-200">Trạng thái server hiện tại:</p>
                {telegramStatus ? (
                  <>
                    <p className={telegramStatus.tokenConfigured ? 'text-green-400' : 'text-red-400'}>
                      {telegramStatus.tokenConfigured
                        ? `✅ TELEGRAM_BOT_TOKEN đã nhận (kết thúc bằng ${telegramStatus.tokenPreview})`
                        : '❌ TELEGRAM_BOT_TOKEN: server KHÔNG nhìn thấy biến này - chưa restart server hoặc chưa khai báo trên host đang chạy.'}
                    </p>
                    <p className={telegramStatus.chatIdConfigured ? 'text-green-400' : 'text-red-400'}>
                      {telegramStatus.chatIdConfigured
                        ? `✅ TELEGRAM_CHAT_ID đã nhận: ${telegramStatus.chatId}`
                        : '❌ TELEGRAM_CHAT_ID: server KHÔNG nhìn thấy biến này.'}
                    </p>
                  </>
                ) : (
                  <p className="text-mist-500">Đang kiểm tra...</p>
                )}
              </div>

              <div className="rounded-xl bg-gold-500/10 border border-gold-500/30 p-4 text-xs text-gold-400 space-y-1.5">
                <p className="font-semibold">Nếu ở trên báo ❌, kiểm tra theo thứ tự:</p>
                <p>1. File .env nằm đúng thư mục <code>server/.env</code> (không phải thư mục gốc hay client).</p>
                <p>2. Tên biến gõ đúng chính xác <code>TELEGRAM_BOT_TOKEN</code> và <code>TELEGRAM_CHAT_ID</code>, không có dấu cách/dấu nháy thừa.</p>
                <p>3. Đã <b>restart lại server</b> (Node chỉ đọc .env lúc khởi động, sửa xong phải tắt bật lại, không tự áp dụng).</p>
                <p>4. Nếu deploy trên Render/Railway/VPS, biến môi trường phải khai báo trong dashboard của nơi đó và <b>redeploy</b> - sửa file .env trên máy local không ảnh hưởng tới server đang chạy trên đó.</p>
              </div>

              {telegramStatus && (!telegramStatus.tokenConfigured || !telegramStatus.chatIdConfigured) ? null : (
                <>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="flex items-center gap-2 rounded-xl bg-ember-gradient px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
                  >
                    {isTestingTelegram ? <FiLoader className="animate-spin" /> : <FiSave />}
                    {isTestingTelegram ? 'Đang gửi...' : 'Gửi tin nhắn thử'}
                  </button>

                  {telegramTestResult && (
                    <p className={`text-sm ${telegramTestResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {telegramTestResult.ok ? '✅ ' : '❌ '}
                      {telegramTestResult.message}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'gateway' && (
            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div className="rounded-xl bg-gold-500/10 border border-gold-500/30 p-3 text-xs text-gold-400 mb-2">
                Đăng ký tài khoản tại nhà cung cấp hợp pháp (SePay, Casso, PayOS) và liên kết với tài khoản ngân hàng thật của shop, sau đó dán API Key / Webhook Secret vào đây.
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Nhà cung cấp</label>
                <select name="provider" defaultValue={config.paymentGateway.provider} className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100">
                  <option value="manual" className="bg-ink-800">Thủ công (Admin tự xác nhận)</option>
                  <option value="sepay" className="bg-ink-800">SePay</option>
                  <option value="casso" className="bg-ink-800">Casso</option>
                  <option value="payos" className="bg-ink-800">PayOS</option>
                  <option value="other" className="bg-ink-800">Khác</option>
                </select>
              </div>

              <Field label="API Key" name="apiKey" type="password" placeholder="Dán API Key tại đây" />
              <Field label="Webhook Secret" name="webhookSecret" type="password" placeholder="Dán Webhook Secret tại đây" />

              <label className="flex items-center gap-2 text-sm text-mist-300">
                <input type="checkbox" name="isEnabled" defaultChecked={config.paymentGateway.isEnabled} className="rounded accent-ember-500" />
                Bật tự động đối soát giao dịch
              </label>

              <SaveButton isSaving={isSaving} />

              {webhookUrl && (
                <div className="mt-3 rounded-xl bg-ink-900 border border-ink-600 p-3">
                  <p className="text-xs text-mist-400 mb-1">Dán URL này vào trang quản trị của nhà cung cấp (SePay/Casso/PayOS):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-ember-400 break-all">{webhookUrl}</code>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Đã sao chép!'); }} className="text-mist-400 hover:text-mist-200 shrink-0">
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {activeTab === 'announcement' && (
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-mist-300">
                <input type="checkbox" name="isActive" defaultChecked={config.announcement.isActive} className="rounded accent-ember-500" />
                Hiển thị thông báo trên website
              </label>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Loại thông báo</label>
                <select name="type" defaultValue={config.announcement.type} className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100">
                  <option value="info" className="bg-ink-800">Thông tin</option>
                  <option value="warning" className="bg-ink-800">Cảnh báo</option>
                  <option value="success" className="bg-ink-800">Thành công</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Nội dung thông báo</label>
                <textarea name="content" defaultValue={config.announcement.content} rows={3} className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 resize-none" />
              </div>

              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'popupAnnouncement' && (
            <form onSubmit={handleSavePopupAnnouncement} className="space-y-4">
              <p className="text-xs text-mist-500 -mt-1">
                Hộp thoại lớn hiện 1 lần khi khách vào web, kèm robot AI vẫy tay - khi khách bấm đóng, nhạc nền (tab "Nhạc nền") sẽ tự động bật.
              </p>

              <label className="flex items-center gap-2 text-sm text-mist-300">
                <input type="checkbox" name="isActive" defaultChecked={config.popupAnnouncement?.isActive} className="rounded accent-ember-500" />
                Bật thông báo popup
              </label>

              <Field label="Tiêu đề" name="title" defaultValue={config.popupAnnouncement?.title} placeholder="VD: 🎉 Khuyến mãi lớn tháng này!" />

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Nội dung</label>
                <textarea
                  name="content"
                  defaultValue={config.popupAnnouncement?.content}
                  rows={4}
                  placeholder="Nội dung chi tiết thông báo tới khách hàng..."
                  className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Ảnh minh họa (tùy chọn)</label>
                {popupImage ? (
                  <div className="mb-3 relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-ink-600">
                    <Image src={popupImage} alt="Ảnh popup" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setPopupImage('')}
                      className="absolute top-1.5 right-1.5 rounded-full bg-ink-950/80 p-1.5 text-mist-300 hover:text-red-400"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : null}
                <input type="file" accept="image/*" onChange={handleUploadPopupImage} className="hidden" id="popup-image-upload" />
                <label
                  htmlFor="popup-image-upload"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 cursor-pointer hover:border-ember-500/50"
                >
                  {isUploadingPopupImage ? <FiLoader className="animate-spin" /> : <FiUpload />}
                  {isUploadingPopupImage ? 'Đang tải lên...' : popupImage ? 'Đổi ảnh khác' : 'Tải ảnh lên'}
                </label>
              </div>

              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'shopInfo' && (
            <form onSubmit={handleSaveShopInfo} className="space-y-4">
              <Field label="Tên shop" name="shopName" defaultValue={config.shopInfo.shopName} />
              <Field label="Email liên hệ" name="contactEmail" defaultValue={config.shopInfo.contactEmail} type="email" />
              <Field label="Link Zalo" name="zaloUrl" defaultValue={config.shopInfo.zaloUrl} placeholder="https://zalo.me/..." />
              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'depositLimits' && (
            <form onSubmit={handleSaveDepositLimits} className="space-y-4">
              <Field label="Số tiền nạp tối thiểu (VND)" name="minAmount" type="number" defaultValue={config.depositLimits.minAmount} />
              <Field label="Số tiền nạp tối đa (VND)" name="maxAmount" type="number" defaultValue={config.depositLimits.maxAmount} />
              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'music' && (
            <form onSubmit={handleSaveMusic} className="space-y-4">
              <p className="text-sm text-mist-400 mb-2">
                Dán link file MP3 trực tiếp (link kết thúc bằng .mp3). Nhạc sẽ phát khi khách bấm nút bắt đầu trên website.
              </p>
              <label className="flex items-center gap-2 text-sm text-mist-300">
                <input type="checkbox" name="isEnabled" defaultChecked={config.musicConfig?.isEnabled} className="rounded accent-ember-500" />
                Bật nhạc nền trên website
              </label>
              <Field label="Link nhạc (MP3)" name="musicUrl" defaultValue={config.musicConfig?.musicUrl} placeholder="https://.../song.mp3" />
              <Field label="Tên bài hát (hiển thị cho khách)" name="title" defaultValue={config.musicConfig?.title} />
              <Field label="Âm lượng (0 - 1)" name="volume" type="number" defaultValue={config.musicConfig?.volume ?? 0.5} placeholder="0.5" />
              <SaveButton isSaving={isSaving} />
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 max-w-xl">
              <div>
                <h3 className="font-semibold text-mist-100 mb-1">Kiểm tra mã TOTP (dùng để reset mật khẩu)</h3>
                <p className="text-sm text-mist-400 mb-3">
                  So sánh mã do server tự tính với mã đang hiện trên app Authenticator của bạn. Nếu khác nhau, nghĩa là biến
                  môi trường <code className="text-ember-400">ADMIN_RESET_TOTP_SECRET</code> trên server thật chưa khớp với
                  secret bạn đã nhập vào app - kiểm tra lại trong bảng Environment Variables của nơi host server (không
                  phải sửa file .env trên GitHub).
                </p>
                <button
                  onClick={handleCheckTotp}
                  disabled={isCheckingTotp}
                  className="flex items-center gap-2 rounded-xl bg-ember-gradient px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
                >
                  {isCheckingTotp ? <FiLoader className="animate-spin" /> : <FiSave />}
                  {isCheckingTotp ? 'Đang kiểm tra...' : 'Kiểm tra mã TOTP hiện tại'}
                </button>

                {totpDebugResult && (
                  <div className="mt-3 rounded-xl bg-ink-900/60 border border-ink-700 p-4 text-sm">
                    {totpDebugResult.success === false ? (
                      <p className="text-red-400">❌ {totpDebugResult.message}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-mist-400">Mã server tính được:</span>
                          <span className="font-mono text-lg text-ember-400 tracking-widest">{totpDebugResult.currentServerCode}</span>
                          <button onClick={() => handleCopyText(totpDebugResult.currentServerCode)} className="text-mist-500 hover:text-mist-200">
                            <FiCopy size={14} />
                          </button>
                        </div>
                        <p className="text-mist-500 text-xs">Giờ server: {totpDebugResult.serverTime}</p>
                        <p className="text-mist-400 text-xs mt-2">{totpDebugResult.note}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-mist-100 mb-1">Kiểm tra IP đang truy cập (dùng cho ADMIN_ALLOWED_IPS)</h3>
                <p className="text-sm text-mist-400 mb-3">
                  Bấm nút này TRÊN CHÍNH thiết bị/mạng bạn muốn thêm vào danh sách IP được phép truy cập trang admin.
                </p>
                <button
                  onClick={handleCheckIp}
                  disabled={isCheckingIp}
                  className="flex items-center gap-2 rounded-xl bg-ember-gradient px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
                >
                  {isCheckingIp ? <FiLoader className="animate-spin" /> : <FiSave />}
                  {isCheckingIp ? 'Đang kiểm tra...' : 'Xem IP hiện tại'}
                </button>

                {ipDebugResult && (
                  <div className="mt-3 rounded-xl bg-ink-900/60 border border-ink-700 p-4 text-sm">
                    {ipDebugResult.success === false ? (
                      <p className="text-red-400">❌ {ipDebugResult.message}</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-mist-400">IP của bạn:</span>
                        <span className="font-mono text-lg text-ember-400">{ipDebugResult.detectedIp}</span>
                        <button onClick={() => handleCopyText(ipDebugResult.detectedIp)} className="text-mist-500 hover:text-mist-200">
                          <FiCopy size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-mist-300 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={type === 'number' ? '0.1' : undefined}
        className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
      />
    </div>
  );
}

function SaveButton({ isSaving }) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="flex items-center gap-2 rounded-xl bg-ember-gradient px-6 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
    >
      {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />} Lưu cấu hình
    </button>
  );
}

/**
 * Quan ly danh muc san pham tuy chinh: Admin co the tu them/sua/xoa
 * danh muc voi ten tuy y, khong bi gioi han boi danh sach co dinh.
 */
function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data);
    } catch (error) {
      toast.error('Không thể tải danh mục.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateForm = () => {
    setEditingCategory(null);
    setName('');
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục.');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, { name });
        toast.success('Đã cập nhật danh mục.');
      } else {
        await api.post('/admin/categories', { name });
        toast.success('Đã thêm danh mục mới.');
      }
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Xóa danh mục "${category.name}"? Sản phẩm đang dùng danh mục này sẽ không bị xóa, nhưng cần đổi danh mục cho chúng sau.`)) return;
    try {
      await api.delete(`/admin/categories/${category._id}`);
      toast.success('Đã xóa danh mục.');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await api.put(`/admin/categories/${category._id}`, { isActive: !category.isActive });
      fetchCategories();
    } catch (error) {
      toast.error('Có lỗi xảy ra.');
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-mist-400">
          Tự thêm danh mục sản phẩm với tên tùy chỉnh (ví dụ: "Proxy", "Key Vip", "Config game"...).
        </p>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 shrink-0 rounded-full bg-ember-gradient px-4 py-2 text-sm font-semibold text-ink-950"
        >
          <FiPlus /> Thêm
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 flex items-end gap-3 rounded-xl border border-ink-600 p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Tên danh mục</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
              placeholder="Ví dụ: Proxy"
              autoFocus
            />
          </div>
          <button type="submit" className="rounded-xl bg-ember-gradient px-5 py-2.5 text-sm font-semibold text-ink-950">
            {editingCategory ? 'Lưu' : 'Tạo'}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-ink-600 p-2.5 text-mist-300">
            <FiX size={18} />
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><FiLoader className="animate-spin text-ember-500" /></div>
      ) : categories.length === 0 ? (
        <p className="text-center text-mist-500 py-8">Chưa có danh mục nào, bấm "Thêm" để tạo mới.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between rounded-xl border border-ink-700 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-mist-100">{cat.name}</p>
                <p className="text-xs text-mist-500">/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full ${cat.isActive ? 'text-green-400 bg-green-400/10' : 'text-mist-400 bg-mist-400/10'}`}
                >
                  {cat.isActive ? 'Hiện' : 'Ẩn'}
                </button>
                <button onClick={() => openEditForm(cat)} className="p-2 rounded-lg hover:bg-ink-700 text-mist-300">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg hover:bg-ink-700 text-red-400">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
