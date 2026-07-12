import LoginForm from '../../../components/auth/LoginForm';

export const metadata = { title: 'Đăng nhập - Khanghuynh.shop' };

export default function LoginPage() {
  return (
    <div className="glass-panel rounded-2xl p-8">
      <h1 className="font-display font-bold text-2xl text-mist-100 text-center">Đăng nhập</h1>
      <p className="text-center text-sm text-mist-400 mt-1 mb-6">Chào mừng trở lại Khanghuynh.shop</p>
      <LoginForm />
    </div>
  );
}
