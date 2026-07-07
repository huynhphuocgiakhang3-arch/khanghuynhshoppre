import RegisterForm from '../../../components/auth/RegisterForm';

export const metadata = { title: 'Đăng ký - Khanghuynh.shop' };

export default function RegisterPage() {
  return (
    <div className="glass-panel rounded-2xl p-8">
      <h1 className="font-display font-bold text-2xl text-mist-100 text-center">Tạo tài khoản</h1>
      <p className="text-center text-sm text-mist-400 mt-1 mb-6">Gia nhập cộng đồng Khanghuynh.shop</p>
      <RegisterForm />
    </div>
  );
}
