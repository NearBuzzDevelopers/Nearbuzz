import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AdminModerationPanel from '../components/AdminModerationPanel';

/**
 * AdminPage — Admin Control Center with red/slate theme.
 * Hosts platform overview metrics, listing moderation, shop verification, and user oversight.
 */
export default function AdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Admin Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-700">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{user.name || 'Admin'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    Platform Admin
                  </span>
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 max-w-xs">
              Verify campus shops, handle student reports, and manage account access from one place.
            </p>
          </div>
        </section>

        <AdminModerationPanel />
      </main>
    </div>
  );
}
