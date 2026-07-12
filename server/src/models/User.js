const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Vui long nhap ten dang nhap'],
      unique: true,
      trim: true,
      minlength: [4, 'Ten dang nhap toi thieu 4 ky tu'],
      maxlength: [32, 'Ten dang nhap toi da 32 ky tu'],
      match: [/^[a-zA-Z0-9_]+$/, 'Ten dang nhap chi gom chu, so va gach duoi'],
    },
    email: {
      type: String,
      required: [true, 'Vui long nhap email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email khong hop le'],
    },
    password: {
      type: String,
      required: [true, 'Vui long nhap mat khau'],
      minlength: [8, 'Mat khau toi thieu 8 ky tu'],
      select: false,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 64,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(0|\+84)[0-9]{9,10}$/, 'So dien thoai khong hop le'],
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'So du khong the am'],
    },
    role: {
      type: String,
      enum: ['user', 'vip', 'advisor', 'admin'],
      default: 'user',
    },
    // Thoi diem duoc admin nang len VIP gan nhat (hien thi "Thanh vien VIP tu...")
    vipSince: {
      type: Date,
      default: null,
    },
    // CHI danh cho role='advisor' (Co van): "so du hoa hong" rieng biet,
    // KHONG lien quan gi den vi mua hang (balance) - moi khi co giao dich
    // nap tien THANH CONG (the cao/QR/chuyen khoan) tren toan he thong,
    // moi tai khoan Co van dang hoat dong deu duoc cong 30% gia tri giao
    // dich do vao day (xem services/advisorCommission.service.js).
    advisorBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // % hoa hong Co van duoc nhan tren moi giao dich nap tien thanh cong
    // (0.3 = 30%). Admin co the chinh rieng cho tung Co van, khong bat buoc
    // giong nhau het.
    advisorCommissionRate: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

/** Hash mat khau truoc khi luu, chi khi password bi thay doi */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** So sanh mat khau nhap vao voi hash trong DB */
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Tra ve object user da loai bo field nhay cam */
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
