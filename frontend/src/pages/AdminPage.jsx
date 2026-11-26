import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AdminModerationPanel from '../components/AdminModerationPanel';

/**
 * AdminPage — Admin-only route with red accent theme.
 *
 * Shows the moderation queue for reports and business verification.
 */
export default function AdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-red-50/20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Admin Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-xl font-bold text-red-700">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user.name || 'Admin'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  🛡️ Admin
                </span>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </section>

        <AdminModerationPanel />
      </main>
    </div>
  );
}
