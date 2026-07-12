
## 6. Thông báo popup + Robot AI vẫy tay + tự bật nhạc khi đóng
Files: `server/src/models/SystemConfig.js`, `server/src/controllers/admin.config.controller.js`, `server/src/routes/admin.routes.js`, `server/src/controllers/contact.controller.js`, `client/src/components/layout/PopupAnnouncement.jsx`, `client/src/components/layout/RobotWaving.jsx`, `client/src/context/useMusicStore.js`, `client/src/components/layout/MusicPlayer.jsx`, `client/src/app/admin/settings/page.jsx`

- Admin vào **Cấu hình → tab "Thông báo popup"**: bật/tắt, đặt tiêu đề, nội dung, ảnh minh họa (tùy chọn).
- Khách vào web (1 lần/phiên trình duyệt, tự hiện lại nếu Admin lưu nội dung mới) sẽ thấy hộp thoại lớn, có robot AI trượt vào từ bên phải và **vẫy tay liên tục** cho đến khi khách bấm nút đóng (X).
- Khi bấm đóng, **nhạc nền do Admin cấu hình (tab "Nhạc nền") tự động bật lên** — dùng chung 1 nguồn audio với nút nhạc góc màn hình (không bị chồng tiếng nếu bấm cả 2 nơi).

## 7. Mã giảm giá (Coupon)
Files: `server/src/models/Coupon.js`, `server/src/controllers/admin.coupon.controller.js`, `server/src/controllers/coupon.controller.js`, `server/src/utils/couponHelper.js`, `server/src/routes/coupon.routes.js`, `server/src/models/Order.js`, `server/src/controllers/order.controller.js`, `client/src/app/admin/coupons/page.jsx`, `client/src/components/admin/CouponFormModal.jsx`, `client/src/components/product/CouponInput.jsx`, `client/src/app/product/[slug]/page.jsx`

- Trang **Admin → Mã giảm giá**: tạo mã với tên gợi nhớ, mã code, số tiền giảm cố định (VND), áp dụng cho tất cả sản phẩm hoặc chọn riêng từng sản phẩm, bật/tắt, xem số lần đã dùng.
- Trang chi tiết sản phẩm có **ô nhập mã giảm giá phong cách cao cấp** (viền gradient sáng) — khách nhập mã, bấm "Áp dụng" để xem trước số tiền được giảm trước khi mua.
- Toàn bộ số tiền giảm được **tính lại và xác thực ở server** (không tin số liệu từ trình duyệt gửi lên) ngay trong transaction tạo đơn hàng, đảm bảo không thể gian lận giá bằng cách sửa request.

## 8. Thay màn hình "giữ để xác minh" bằng kiểu tích ô bảo mật
File: `client/src/components/security/HumanGate.jsx`

Đổi giao diện xác minh "không phải bot" từ kiểu giữ nút sang kiểu **tích vào ô vuông "Xác minh bạn là con người"** trên nền sáng, kèm tiêu đề tên miền, dòng "Đang thực hiện xác minh bảo mật", mã Verification ID và dòng chữ nhỏ cuối trang — theo đúng bố cục ảnh mẫu bạn gửi. (Không dùng tên/logo Cloudflare để tránh vi phạm bản quyền thương hiệu — dùng thương hiệu riêng "Khanghuynh Shop Security"). Đây vẫn là 1 lớp rào cản cơ bản chống bot đơn giản, không phải CAPTCHA chống bot nâng cao thực sự (muốn mạnh hơn cần đăng ký Cloudflare Turnstile/Google reCAPTCHA thật với site key riêng của bạn).
