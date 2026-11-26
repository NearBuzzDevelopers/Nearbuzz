import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { CATEGORY_LABELS } from '../utils/constants';

/**
 * DashboardPage — Student-only home dashboard.
 * Kept strictly focused on Student tasks: saved places, finding nearby services, and reading updates.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFollows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/follows/my');
      setFollows(res.data);
    } catch {
      setFollows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFollows();
  }, [user, loadFollows]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-blue-50/30">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Student Profile Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{user.name || 'Student'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    🎓 Student
                  </span>
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
              >
                🔍 Find Services Nearby
              </Link>
              <Link
                to="/feed"
                className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-sm font-semibold text-indigo-700 transition"
              >
                📢 Check Updates
              </Link>
            </div>
          </div>
        </section>

        {/* Followed Businesses */}
        <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">My Saved Places</h2>
          <p className="text-sm text-gray-500 mb-4">
            Hostels, messes, and shops you follow — their daily notices appear in your Updates feed.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : follows.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4">
              <p className="text-3xl mb-2">📍</p>
              <p className="font-semibold text-gray-800 mb-1">No saved places yet</p>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Open any hostel, mess, or shop and tap "Follow" so you never miss their room vacancies or today's menu.
              </p>
              <Link
                to="/"
                className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
              >
                Browse Nearby Places
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {follows.map((f) => (
                <Link
                  key={f.businessId}
                  to={`/businesses/${f.businessId}`}
                  className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition bg-gray-50 group"
                >
                  <p className="text-xs font-semibold text-blue-600">
                    {CATEGORY_LABELS[f.category] || f.category}
                  </p>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition">
                    {f.businessName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{f.address}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Subtle vendor registration link for shopkeepers who signed in as student */}
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            Do you own a hostel, mess, or shop near campus?{' '}
            <Link to="/register-shop" className="text-emerald-700 font-semibold hover:underline">
              List your shop as a Vendor →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
