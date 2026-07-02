import RequireAuth from '../../components/auth/RequireAuth';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AmbientBackground from '../../components/layout/AmbientBackground';
import AntiInspectGuard from '../../components/security/AntiInspectGuard';

export const metadata = { title: 'Quản trị - Khanghuynh.shop' };

export default function AdminLayout({ children }) {
  return (
    <RequireAuth adminOnly>
      <AmbientBackground variant="admin" />
      <AntiInspectGuard />
      <div className="relative z-10 flex flex-col sm:flex-row bg-transparent">
        <AdminSidebar />
        <main className="flex-1 p-5 sm:p-8 min-w-0">{children}</main>
      </div>
    </RequireAuth>
  );
}
