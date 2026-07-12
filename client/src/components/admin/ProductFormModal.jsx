'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiLoader, FiX, FiUpload, FiFile, FiTrash2, FiPlus, FiCheck, FiLayers, FiVideo } from 'react-icons/fi';
import api from '../../lib/api';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  salePrice: '',
  stock: 0,
  soldCount: 0,
  shortDescription: '',
  description: '',
  thumbnail: '',
  thumbnailPublicId: '',
  testVideoUrl: '',
  testVideoPublicId: '',
  testVideoThumbnail: '',
  purchaseNote: '',
  isActive: true,
  isFeatured: false,
};

const EMPTY_VARIANT = { name: '', price: '', salePrice: '', stock: 0, deliveryFiles: [], purchaseNote: '' };

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEditing = Boolean(product);
  const fileInputRef = useRef(null);
  const deliveryInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          category: product.category,
          price: product.price,
          salePrice: product.salePrice || '',
          stock: product.stock,
          soldCount: product.soldCount || 0,
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          thumbnail: product.thumbnail || '',
          thumbnailPublicId: product.thumbnailPublicId || '',
          testVideoUrl: product.testVideoUrl || '',
          testVideoPublicId: product.testVideoPublicId || '',
          testVideoThumbnail: product.testVideoThumbnail || '',
          purchaseNote: product.purchaseNote || '',
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }
      : EMPTY_FORM
  );
  const [deliveryFiles, setDeliveryFiles] = useState(product?.deliveryFiles || []);
  const [features, setFeatures] = useState(
    product?.features?.length > 0 ? product.features : ['']
  );

  // Quan ly nhieu goi (variants): bat/tat bang 1 checkbox, moi goi co ten/
  // gia/gia sale/kho/file giao hang rieng. Khi bat, gia/kho goc cua san pham
  // se khong dung den (gia hien thi se la khoang Tu X - Y lay tu cac goi).
  const [hasVariants, setHasVariants] = useState(product?.variants?.length > 0);
  const [variants, setVariants] = useState(
    product?.variants?.length > 0
      ? product.variants.map((v) => ({
          name: v.name,
          price: v.price,
          salePrice: v.salePrice || '',
          stock: v.stock,
          deliveryFiles: v.deliveryFiles || [],
          purchaseNote: v.purchaseNote || '',
        }))
      : [EMPTY_VARIANT]
  );
  const [uploadingVariantFileIdx, setUploadingVariantFileIdx] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    api
      .get('/admin/categories')
      .then(({ data }) => setCategories(data.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  /** Upload anh thumbnail truc tiep tu may nguoi dung, khong can dan link */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/admin/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, thumbnail: data.data.url, thumbnailPublicId: data.data.publicId }));
      toast.success('Đã tải ảnh lên.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Upload video test/demo san pham - hien o the san pham + trang chi tiet */
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video tối đa 100MB.');
      return;
    }

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/admin/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        testVideoUrl: data.data.url,
        testVideoPublicId: data.data.publicId,
        testVideoThumbnail: data.data.thumbnail || '',
      }));
      toast.success('Đã tải video test lên.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải video thất bại.');
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setForm((f) => ({ ...f, testVideoUrl: '', testVideoPublicId: '', testVideoThumbnail: '' }));
  };

  /**
   * Upload file giao hang cho san pham KHONG co variants - ho tro chon
   * NHIEU FILE CUNG LUC (input co thuoc tinh `multiple`). Cac file duoc
   * upload TUAN TU (khong goi song song) de tranh qua tai server/Cloudinary
   * khi Admin chon vai chuc file 1 luc, va de neu 1 file loi giua chung thi
   * van biet chinh xac file nao loi thay vi loi hang loat khong ro nguyen nhan.
   */
  const handleDeliveryFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingFile(true);
    let successCount = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/admin/upload/delivery-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDeliveryFiles((prev) => [...prev, data.data]);
        successCount += 1;
      } catch (error) {
        toast.error(`"${file.name}": ${error.response?.data?.message || 'Tải file thất bại.'}`);
      }
    }
    if (successCount > 0) toast.success(`Đã tải lên ${successCount}/${files.length} file.`);
    setIsUploadingFile(false);
    if (deliveryInputRef.current) deliveryInputRef.current.value = '';
  };

  const handleRemoveDeliveryFile = (idx) => {
    setDeliveryFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Quan ly danh sach features (checklist) - them/sua/xoa tung dong */
  const handleFeatureChange = (idx, value) => {
    setFeatures((prev) => prev.map((f, i) => (i === idx ? value : f)));
  };

  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, '']);
  };

  const handleRemoveFeature = (idx) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Quan ly danh sach variants (cac goi) */
  const handleVariantFieldChange = (idx, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);
  };

  const handleRemoveVariant = (idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  /** Upload file giao hang rieng cho 1 variant cu the - ho tro chon nhieu file cung luc */
  const handleVariantFileUpload = async (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingVariantFileIdx(idx);
    let successCount = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/admin/upload/delivery-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setVariants((prev) =>
          prev.map((v, i) => (i === idx ? { ...v, deliveryFiles: [...v.deliveryFiles, data.data] } : v))
        );
        successCount += 1;
      } catch (error) {
        toast.error(`"${file.name}": ${error.response?.data?.message || 'Tải file thất bại.'}`);
      }
    }
    if (successCount > 0) toast.success(`Đã tải lên ${successCount}/${files.length} file cho gói.`);
    setUploadingVariantFileIdx(null);
    e.target.value = '';
  };

  const handleRemoveVariantFile = (variantIdx, fileIdx) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx ? { ...v, deliveryFiles: v.deliveryFiles.filter((_, fi) => fi !== fileIdx) } : v
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error('Vui lòng chọn danh mục sản phẩm.');
      return;
    }

    if (hasVariants) {
      const invalidVariant = variants.find((v) => !v.name.trim() || !v.price);
      if (invalidVariant) {
        toast.error('Mỗi gói cần có tên và giá hợp lệ.');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      stock: Number(form.stock),
      soldCount: Number(form.soldCount) || 0,
      deliveryFiles,
      features: features.map((f) => f.trim()).filter(Boolean),
      variants: hasVariants
        ? variants.map((v) => ({
            name: v.name.trim(),
            price: Number(v.price),
            salePrice: v.salePrice ? Number(v.salePrice) : null,
            stock: Number(v.stock) || 0,
            deliveryFiles: v.deliveryFiles,
            purchaseNote: v.purchaseNote || '',
          }))
        : [],
    };

    try {
      if (isEditing) {
        await api.put(`/admin/products/${product._id}`, payload);
        toast.success('Đã cập nhật sản phẩm.');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Đã tạo sản phẩm mới.');
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl text-mist-100">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button onClick={onClose} className="text-mist-400 hover:text-mist-200">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Tên sản phẩm</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Danh mục</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
            >
              <option value="" className="bg-ink-800">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.slug} className="bg-ink-800">
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-gold-500 mt-1">
                Chưa có danh mục nào. Vào Cấu hình → Danh mục sản phẩm để tạo.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">
              Số đã bán <span className="text-mist-500">(tự chỉnh)</span>
            </label>
            <input
              type="number"
              name="soldCount"
              value={form.soldCount}
              onChange={handleChange}
              min={0}
              className="w-full sm:w-1/2 rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
            />
          </div>

          {/* Toggle bat/tat che do nhieu goi (variants) */}
          <label className="flex items-center gap-2.5 rounded-xl border border-ink-600 px-4 py-3 cursor-pointer hover:border-ember-500/40">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="rounded accent-ember-500"
            />
            <FiLayers className="text-ember-400" size={16} />
            <span className="text-sm text-mist-200 font-medium">Sản phẩm có nhiều gói (ví dụ: 1 tháng, 3 tháng...)</span>
          </label>

          {!hasVariants ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-mist-300 mb-1.5">Giá gốc (VND)</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required={!hasVariants}
                    min={0}
                    className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mist-300 mb-1.5">Giá sale (tùy chọn)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={form.salePrice}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">Số lượng kho</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min={0}
                  className="w-full sm:w-1/2 rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
                />
              </div>

              {/* Upload file giao hang cho san pham KHONG variants */}
              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">
                  File giao cho khách (sau khi mua, khách sẽ nhận được các file này)
                </label>

                {deliveryFiles.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {deliveryFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-2 text-xs">
                        <span className="flex items-center gap-2 text-mist-300 truncate">
                          <FiFile className="shrink-0" /> {file.name || 'File'}
                        </span>
                        <button type="button" onClick={() => handleRemoveDeliveryFile(idx)} className="text-red-400 shrink-0 ml-2">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={deliveryInputRef}
                  type="file"
                  multiple
                  onChange={handleDeliveryFileUpload}
                  className="hidden"
                  id="delivery-file-upload"
                />
                <label
                  htmlFor="delivery-file-upload"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 cursor-pointer hover:border-ember-500/50"
                >
                  {isUploadingFile ? <FiLoader className="animate-spin" /> : <FiPlus />}
                  {isUploadingFile ? 'Đang tải lên...' : 'Thêm file giao hàng (chọn được nhiều file)'}
                </label>
              </div>

              {/* Ghi chu san pham hien cho khach SAU KHI mua (khong hien cong khai) */}
              <div>
                <label className="block text-sm font-medium text-mist-300 mb-1.5">
                  Ghi chú sau khi mua <span className="text-mist-500">(khách chỉ thấy sau khi đã thanh toán)</span>
                </label>
                <textarea
                  name="purchaseNote"
                  value={form.purchaseNote}
                  onChange={handleChange}
                  rows={3}
                  maxLength={3000}
                  placeholder="Ví dụ: Hướng dẫn kích hoạt, lưu ý bảo hành, cách đăng nhập..."
                  className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 resize-none"
                />
              </div>
            </>
          ) : (
            /* Danh sach cac goi (variants), moi goi co the gap/thu gon */
            <div className="space-y-3">
              <label className="block text-sm font-medium text-mist-300">Danh sách gói</label>
              {variants.map((variant, idx) => (
                <div key={idx} className="rounded-xl border border-ink-600 p-4 space-y-3 bg-ink-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ember-400">Gói #{idx + 1}</span>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => handleRemoveVariant(idx)} className="text-red-400">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => handleVariantFieldChange(idx, 'name', e.target.value)}
                    placeholder="Tên gói, ví dụ: 1 tháng"
                    className="w-full rounded-xl glass-input px-4 py-2 text-sm text-mist-100"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantFieldChange(idx, 'price', e.target.value)}
                      placeholder="Giá"
                      min={0}
                      className="rounded-xl glass-input px-3 py-2 text-sm text-mist-100"
                    />
                    <input
                      type="number"
                      value={variant.salePrice}
                      onChange={(e) => handleVariantFieldChange(idx, 'salePrice', e.target.value)}
                      placeholder="Giá sale"
                      min={0}
                      className="rounded-xl glass-input px-3 py-2 text-sm text-mist-100"
                    />
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => handleVariantFieldChange(idx, 'stock', e.target.value)}
                      placeholder="Kho"
                      min={0}
                      className="rounded-xl glass-input px-3 py-2 text-sm text-mist-100"
                    />
                  </div>

                  {/* File giao hang rieng cho goi nay */}
                  {variant.deliveryFiles.length > 0 && (
                    <div className="space-y-1">
                      {variant.deliveryFiles.map((file, fileIdx) => (
                        <div key={fileIdx} className="flex items-center justify-between rounded-lg border border-ink-700 px-3 py-1.5 text-xs">
                          <span className="flex items-center gap-2 text-mist-300 truncate">
                            <FiFile className="shrink-0" size={12} /> {file.name || 'File'}
                          </span>
                          <button type="button" onClick={() => handleRemoveVariantFile(idx, fileIdx)} className="text-red-400 shrink-0 ml-2">
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleVariantFileUpload(idx, e)}
                    className="hidden"
                    id={`variant-file-${idx}`}
                  />
                  <label
                    htmlFor={`variant-file-${idx}`}
                    className="inline-flex items-center gap-1.5 text-xs text-ember-400 hover:text-ember-300 cursor-pointer"
                  >
                    {uploadingVariantFileIdx === idx ? <FiLoader className="animate-spin" size={12} /> : <FiPlus size={12} />}
                    Thêm file cho gói này (chọn được nhiều file)
                  </label>

                  {/* Ghi chu rieng cho goi nay - de trong se dung ghi chu chung cua san pham */}
                  <textarea
                    value={variant.purchaseNote}
                    onChange={(e) => handleVariantFieldChange(idx, 'purchaseNote', e.target.value)}
                    rows={2}
                    maxLength={3000}
                    placeholder="Ghi chú sau khi mua riêng cho gói này (bỏ trống nếu gói này không cần ghi chú riêng)"
                    className="w-full rounded-xl glass-input px-3 py-2 text-xs text-mist-100 resize-none"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 text-sm text-ember-400 hover:text-ember-300"
              >
                <FiPlus size={14} /> Thêm gói khác
              </button>
            </div>
          )}

          {/* Upload anh thumbnail tu may, khong can dan link */}
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Ảnh sản phẩm (banner)</label>
            {form.thumbnail && (
              <div className="relative w-full aspect-video mb-2 rounded-xl overflow-hidden border border-ink-600">
                <Image src={form.thumbnail} alt="Xem trước" fill className="object-cover" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="thumbnail-upload" />
            <label
              htmlFor="thumbnail-upload"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 cursor-pointer hover:border-ember-500/50"
            >
              {isUploadingImage ? <FiLoader className="animate-spin" /> : <FiUpload />}
              {isUploadingImage ? 'Đang tải lên...' : form.thumbnail ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
            </label>
          </div>

          {/* Upload video test/demo san pham */}
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">
              Video test sản phẩm <span className="text-mist-500">(hiện nút Play trên thẻ &amp; trang chi tiết)</span>
            </label>
            {form.testVideoUrl ? (
              <div className="relative w-full aspect-video mb-2 rounded-xl overflow-hidden border border-ink-600 bg-black">
                <video
                  src={form.testVideoUrl}
                  poster={form.testVideoThumbnail || form.thumbnail || undefined}
                  controls
                  className="h-full w-full"
                />
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 rounded-full bg-ink-950/80 p-1.5 text-red-400 hover:text-red-300 border border-ink-600"
                  aria-label="Xóa video"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ) : null}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="test-video-upload"
            />
            <label
              htmlFor="test-video-upload"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-2.5 text-sm text-mist-300 cursor-pointer hover:border-ember-500/50"
            >
              {isUploadingVideo ? <FiLoader className="animate-spin" /> : <FiVideo />}
              {isUploadingVideo ? 'Đang tải video lên...' : form.testVideoUrl ? 'Đổi video khác' : 'Chọn video từ máy'}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Mô tả ngắn</label>
            <input
              type="text"
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              maxLength={300}
              placeholder="Hiện ngay trên thẻ sản phẩm"
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">Mô tả chi tiết</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl glass-input px-4 py-2.5 text-sm text-mist-100 resize-none"
            />
          </div>

          {/* Danh sach tinh nang dang checklist (✓), hien thi o card va trang chi tiet */}
          <div>
            <label className="block text-sm font-medium text-mist-300 mb-1.5">
              Tính năng nổi bật <span className="text-mist-500">(hiện dạng checklist ✓)</span>
            </label>
            <div className="space-y-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FiCheck className="text-green-400 shrink-0" size={16} />
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="Ví dụ: Không cần root, an toàn 100%"
                    className="flex-1 rounded-xl glass-input px-4 py-2 text-sm text-mist-100"
                  />
                  {features.length > 1 && (
                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-400 shrink-0">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-ember-400 hover:text-ember-300"
            >
              <FiPlus size={12} /> Thêm tính năng
            </button>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-mist-300">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded accent-ember-500" />
              Đang bán
            </label>
            <label className="flex items-center gap-2 text-sm text-mist-300">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="rounded accent-ember-500" />
              Nổi bật (hiện trang chủ)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-ink-600 py-3 text-sm font-medium text-mist-300">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
            >
              {isSubmitting ? <FiLoader className="animate-spin" /> : isEditing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
