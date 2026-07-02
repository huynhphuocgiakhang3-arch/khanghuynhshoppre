# Khanghuynh.shop — Hệ thống Website Thương mại Điện tử (Bán file game Free Fire)

Hệ thống full-stack: **Next.js (App Router) + Tailwind CSS** (client) và **Node.js/Express + MongoDB (Mongoose)** (server).

> ⚠️ **Ghi chú quan trọng về phạm vi dự án**
> Hệ thống này **KHÔNG** bao gồm tính năng "gạch thẻ tự động" (card-checking) vì đây là dịch vụ phần lớn vận hành ngoài pháp luật tại Việt Nam.
> Phần "đối soát thanh toán tự động" trong dự án được xây dựng theo kiến trúc tổng quát (webhook adapter), tương thích với các cổng trung gian **hợp pháp** như **SePay, Casso, PayOS**. Bạn cần tự đăng ký tài khoản với một trong các nhà cung cấp này và điền API Key vào trang Admin.

---

## 1. Cấu trúc thư mục

```
khanghuynh-shop/
├── server/                  # Backend Express + MongoDB
│   ├── src/
│   │   ├── config/          # db.js, mailer.js
│   │   ├── models/          # User, Product, Order, Transaction, SystemConfig
│   │   ├── controllers/     # Logic xử lý nghiệp vụ
│   │   ├── routes/          # Định tuyến API
│   │   ├── middlewares/     # auth, admin, validate, errorHandler
│   │   ├── services/        # mail, vietqr, paymentGateway
│   │   ├── utils/           # token, AppError, catchAsync, validators
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
│
├── client/                  # Frontend Next.js App Router
│   ├── src/
│   │   ├── app/              # Các route (page.jsx theo App Router)
│   │   ├── components/       # UI components theo module
│   │   ├── context/          # Zustand store (auth)
│   │   ├── lib/               # axios instance, utils
│   │   └── styles/            # globals.css
│   ├── .env.local.example
│   └── package.json
│
├── package.json             # Script gốc dùng concurrently
└── README.md
```

---

## 2. Yêu cầu hệ thống

- **Node.js** >= 18.x
- **MongoDB** (local hoặc MongoDB Atlas)
- npm >= 9.x

---

## 3. Cài đặt

### Bước 1 — Clone & cài dependencies

Từ thư mục gốc `khanghuynh-shop/`:

```bash
npm install              # cài concurrently ở root
npm run install:all      # cài cả server + client cùng lúc
```

Hoặc cài riêng từng phần:

```bash
cd server && npm install
cd ../client && npm install
```

### Bước 2 — Cấu hình biến môi trường

**Server** — copy file mẫu và điền thông tin thật:

```bash
cd server
cp .env.example .env
```

Sửa các giá trị quan trọng trong `server/.env`:

| Biến | Mô tả |
|---|---|
| `MONGO_URI` | Chuỗi kết nối MongoDB (local hoặc Atlas) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Chuỗi bí mật ngẫu nhiên, dài, **không dùng giá trị mẫu khi deploy thật** |
| `SMTP_USER`, `SMTP_PASS` | Gmail App Password (hoặc SMTP provider khác) để gửi email |
| `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME` | Thông tin ngân hàng nhận tiền (cũng có thể sửa sau trong trang Admin) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Lấy từ Dashboard Cloudinary (đăng ký free tại cloudinary.com), dùng để lưu ảnh sản phẩm và file giao cho khách |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME` | Thông tin tài khoản Admin đầu tiên, dùng khi seed |

**Client** — copy file mẫu:

```bash
cd client
cp .env.local.example .env.local
```

Sửa `NEXT_PUBLIC_API_URL` nếu server không chạy ở `http://localhost:5000/api`.

### Bước 3 — Khởi động MongoDB

Nếu chạy MongoDB local:

```bash
mongod --dbpath /duong/dan/data
```

Hoặc dùng MongoDB Atlas (cloud) — dán connection string vào `MONGO_URI`.

> ⚠️ **Quan trọng**: Hệ thống dùng **MongoDB Transaction** (trong `order.controller.js`, khi tạo đơn hàng) để đảm bảo trừ tiền + tạo đơn + trừ kho diễn ra đồng thời (atomic). Transaction **chỉ hoạt động trên MongoDB Replica Set**, không hoạt động trên MongoDB standalone thông thường.
>
> - **MongoDB Atlas** (cloud): mặc định đã là replica set, không cần làm gì thêm.
> - **MongoDB local**: cần khởi tạo replica set 1 node bằng cách:
>   ```bash
>   mongod --dbpath /duong/dan/data --replSet rs0
>   ```
>   Sau đó mở `mongosh` và chạy lệnh khởi tạo (chỉ cần làm 1 lần):
>   ```js
>   rs.initiate()
>   ```
>   Rồi cập nhật `MONGO_URI` trong `.env` thành: `mongodb://127.0.0.1:27017/khanghuynh_shop?replicaSet=rs0`

### Bước 4 — Tạo tài khoản Admin đầu tiên

```bash
cd server
npm run seed:admin
```

Script sẽ tạo 1 tài khoản admin theo `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_USERNAME` trong `.env`. **Đăng nhập và đổi mật khẩu ngay sau khi seed.**

### Bước 4b — (Tùy chọn) Tạo sản phẩm mẫu để demo nhanh

```bash
cd server
npm run seed:products
```

Tạo sẵn 4 sản phẩm mẫu (tài khoản, kim cương, skin, vé quay) để bạn xem giao diện ngay không cần tự thêm thủ công.

---

## 4. Chạy dự án (Development)

### Chạy cả server + client cùng lúc bằng `concurrently` (khuyến nghị)

Từ thư mục gốc `khanghuynh-shop/`:

```bash
npm run dev
```

Lệnh này dùng `concurrently` để chạy đồng thời:
- **Server** (`nodemon src/server.js`) tại `http://localhost:5000`
- **Client** (`next dev`) tại `http://localhost:3000`

Output sẽ hiện 2 màu khác nhau (`SERVER` màu xanh dương, `CLIENT` màu xanh lá) để dễ phân biệt log.

### Hoặc chạy riêng từng phần (2 terminal khác nhau)

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

Truy cập:
- Website: `http://localhost:3000`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

---

## 5. Cấu hình thanh toán tự động (SePay / Casso / PayOS)

1. Đăng ký tài khoản tại một trong các nhà cung cấp:
   - [SePay](https://sepay.vn)
   - [Casso](https://casso.vn)
   - [PayOS](https://payos.vn)
2. Liên kết tài khoản ngân hàng **thật** của shop với nhà cung cấp đó (theo hướng dẫn của họ).
3. Đăng nhập trang Admin → **Cấu hình → Cổng thanh toán**:
   - Chọn nhà cung cấp
   - Dán `API Key` / `Webhook Secret` được cấp
   - Bật "Tự động đối soát giao dịch"
   - Lưu cấu hình — hệ thống sẽ hiển thị **Webhook URL** (dạng `https://yourdomain.com/api/payment/webhook`)
4. Copy Webhook URL đó, dán vào trang quản trị của nhà cung cấp (SePay/Casso/PayOS) ở phần cấu hình Webhook.
5. Từ lúc này, mỗi khi có tiền vào tài khoản ngân hàng với đúng nội dung chuyển khoản, hệ thống sẽ **tự động cộng số dư** cho user.

Nếu không dùng cổng nào (chế độ `manual`), Admin có thể tự cộng số dư cho user qua trang **Quản lý người dùng → Điều chỉnh số dư** sau khi xác minh thủ công.

---

## 6. Build & Deploy (Production)

### Build client

```bash
cd client
npm run build
npm run start    # chạy ở port 3000 theo mode production
```

### Chạy server production

```bash
cd server
NODE_ENV=production npm run start
```

Khuyến nghị dùng **PM2** để giữ server luôn chạy:

```bash
npm install -g pm2
pm2 start server/src/server.js --name khanghuynh-api
pm2 start "npm run start --prefix client" --name khanghuynh-web
```

---

## 7. Đẩy link Localhost ra Public (Tunneling)

Khi đang phát triển/test và muốn chia sẻ link demo cho người khác (hoặc để webhook của SePay/Casso/PayOS có thể gọi vào máy local của bạn), dùng **ngrok** hoặc **cloudflared**.

### Cách 1 — Dùng ngrok

1. Cài ngrok: https://ngrok.com/download
2. Đăng ký tài khoản free, lấy authtoken, cấu hình:
   ```bash
   ngrok config add-authtoken <YOUR_TOKEN>
   ```
3. Đẩy public cho **server** (port 5000) — dùng cho webhook thanh toán:
   ```bash
   ngrok http 5000
   ```
   Ngrok trả về URL dạng `https://xxxx.ngrok-free.app` → dùng URL này + `/api/payment/webhook` để dán vào trang quản trị SePay/Casso/PayOS.

4. Đẩy public cho **client** (port 3000) — nếu muốn người khác xem giao diện:
   ```bash
   ngrok http 3000
   ```
   ⚠️ Nhớ cập nhật `NEXT_PUBLIC_API_URL` trong `client/.env.local` thành URL public của server, và `CLIENT_URL` trong `server/.env` thành URL public của client (để CORS hoạt động đúng), sau đó restart cả 2.

### Cách 2 — Dùng Cloudflare Tunnel (cloudflared)

1. Cài cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Chạy tunnel nhanh (không cần tài khoản Cloudflare, dùng để demo tạm):
   ```bash
   cloudflared tunnel --url http://localhost:5000
   ```
   Lệnh tương tự cho client:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflared sẽ trả về URL dạng `https://xxxx.trycloudflare.com`, dùng tương tự như ngrok ở trên.

> 💡 **Lưu ý bảo mật**: Tunnel chỉ nên dùng cho mục đích demo/test. Khi deploy thật, nên dùng VPS/Cloud (VD: DigitalOcean, AWS, Render, Railway, Vercel cho client) với domain và SSL chính thức.

---

## 8. Danh sách thư viện đã sử dụng

### Server (`server/package.json`)
`express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `express-validator`, `nodemailer`, `morgan`, `qrcode`, `axios`, `crypto-js`, `multer`, `cookie-parser`, `compression`, `node-cron`, `uuid`, `nodemon` (dev)

### Client (`client/package.json`)
`next`, `react`, `react-dom`, `axios`, `framer-motion`, `gsap`, `js-cookie`, `jwt-decode`, `react-hot-toast`, `react-icons`, `recharts`, `clsx`, `zustand`, `tailwindcss`, `postcss`, `autoprefixer`

---

## 9. Tài khoản & Luồng nghiệp vụ chính

- **Đăng ký / Đăng nhập**: JWT (access + refresh token), mật khẩu hash bằng bcrypt, regex validate email/password/username.
- **Quên mật khẩu**: gửi link reset qua email (token hash SHA-256, hết hạn 15 phút).
- **Nạp tiền**: tạo mã VietQR động (qua `img.vietqr.io`, không cần API key) → khách chuyển khoản đúng nội dung → webhook từ cổng thanh toán tự động khớp lệnh và cộng số dư.
- **Mua hàng**: trừ tiền trong ví (MongoDB transaction đảm bảo tính nhất quán), tự động cập nhật kho, gửi email xác nhận đơn hàng.
- **Admin**: Dashboard thống kê, CRUD sản phẩm, quản lý user (sửa số dư / reset pass / khóa / xóa), cấu hình ngân hàng + cổng thanh toán + thông báo shop.

---

## 10. Bảo mật đã áp dụng

- Hash mật khẩu bằng `bcryptjs` (salt rounds = 12)
- JWT access token + refresh token riêng biệt, tự động refresh ở client
- Middleware `protect` + `adminOnly` bảo vệ nghiêm ngặt route admin
- `helmet` (security headers), `express-rate-limit` (chống brute-force), `cors` (giới hạn origin)
- Validate input bằng `express-validator` ở mọi route nhận dữ liệu từ người dùng
- Webhook thanh toán xác thực bằng API Key/Secret riêng, không dùng JWT
- Số dư không thể âm (validate ở schema + logic nghiệp vụ)

## 11. Các tính năng bổ sung (vòng 2)

- **Upload ảnh & file giao hàng**: Admin upload trực tiếp từ máy (ảnh sản phẩm, file giao cho khách sau khi mua) qua Cloudinary, không cần dán link thủ công.
- **Danh mục tùy chỉnh**: Admin tự thêm/sửa/xóa danh mục sản phẩm với tên tùy ý (Cấu hình → Danh mục sản phẩm), không bị giới hạn danh sách cố định.
- **Nhạc nền**: Admin dán link MP3 (Cấu hình → Nhạc nền), người dùng bấm nút góc dưới phải màn hình để bắt đầu nghe.
- **Theme sáng/tối**: nút mặt trời/mặt trăng trên header, lựa chọn được lưu lại cho lần ghé sau.
- **Cập nhật gần như tức thì (~1 giây)**: trang chủ, trang sản phẩm, banner thông báo tự động lấy dữ liệu mới mỗi giây — khi Admin sửa nội dung, người dùng đang xem Shop sẽ thấy thay đổi mà không cần F5 lại trang.
- **Liên hệ**: chuyển từ số điện thoại/Facebook sang Zalo (Cấu hình → Thông tin shop, nhập link Zalo).
