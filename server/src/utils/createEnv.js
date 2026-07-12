const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
const envContent = `# ===== SERVER CONFIG =====
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# ===== DATABASE =====
MONGO_URI=mongodb://127.0.0.1:27017/khanghuynh_shop

# ===== JWT =====
JWT_SECRET=thay_doi_chuoi_bi_mat_nay_thanh_chuoi_ngau_nhien_dai
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=thay_doi_chuoi_bi_mat_refresh_nay_cung_phai_random
JWT_REFRESH_EXPIRES_IN=30d

# ===== ADMIN SEED =====
ADMIN_EMAIL=admin@khanghuynh.shop
ADMIN_PASSWORD=DoiMatKhauNganNgay123!
ADMIN_USERNAME=superadmin

# ===== NODEMAILER =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=Khanghuynh.shop

# ===== VIETQR =====
VIETQR_BANK_BIN=970423
VIETQR_BANK_NAME=TPBank
VIETQR_ACCOUNT_NO=10002181284
VIETQR_ACCOUNT_NAME=HUYNH PHUOC GIA AN
VIETQR_TEMPLATE=compact

# ===== VIETQR TOKEN =====
VIETQR_TOKEN=eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOiI1MDRkZjMwYS1mNDIzLTQ3YjktYTkyMS1hNzg0YzdmM2JmMzkiLCJob3N0aW5nIjoia2hhbmdodXluaHNob3BwcmUudmVyY2VsLmFwcCIsInBob25lTm8iOiIwODc4MTAxNjAxIiwiZmlyc3ROYW1lIjoiMDg3ODEwMTYwMSIsIm1pZGRsZU5hbWUiOiIiLCJsYXN0TmFtZSI6IiIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJpYXQiOjE3ODM0OTg5MTZ9.3rLqBxLja1SS1J3at8FQoZ_P7CMRJSRcSZWqltxnhBvoXySH57G4YzgGcAw94NyiM2nPZs6KcOF7cUykgM3kKw

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ===== PAYMENT GATEWAY =====
PAYMENT_PROVIDER=manual
PAYMENT_API_KEY=
PAYMENT_WEBHOOK_SECRET=

# ===== BANK_TOKEN =====
BANK_TOKEN=

# ===== RATE LIMIT =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

# ===== TELEGRAM BOT =====
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ADMIN_URL=http://localhost:3000/admin

# ===== ADMIN SECURITY =====
ADMIN_ALLOWED_IPS=
ADMIN_SECURITY_PIN=
ADMIN_RESET_TOTP_SECRET=
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ File .env đã được tạo thành công tại:', envPath);
  console.log('📝 Nội dung đã bao gồm:');
  console.log('   - TPBank (BIN: 970423)');
  console.log('   - Số tài khoản: 10002181284');
  console.log('   - Tên: HUYNH PHUOC GIA AN');
  console.log('   - VietQR Token đã được cấu hình');
  console.log('');
  console.log('⚠️  BẬT LẠI SERVER để áp dụng thay đổi!');
} catch (error) {
  console.error('❌ Lỗi khi tạo file .env:', error.message);
}
