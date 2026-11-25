import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { CATEGORY_LABELS, UPDATE_TYPE_LABELS, formatTimeAgo } from '../utils/constants';

export default function UpdatesFeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all'); // 'all' | 'following'
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async () => {
    if (tab === 'following' && !user) {
      setUpdates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = tab === 'following' ? '/updates/following' : '/updates/feed';
      const res = await api.get(url);
      setUpdates(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load updates feed.');
    } finally {
      setLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campus Updates Feed</h1>
            <p className="text-sm text-gray-500">
              Live room vacancies, mess menus, and stock notices from nearby vendors
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                tab === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Updates
            </button>
            <button
              onClick={() => setTab('following')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                tab === 'following' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {tab === 'following' && !user ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sign in to see updates from businesses you follow
            </h2>
            <Link
              to="/login"
              state={{ from: '/feed' }}
              className="inline-block mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              {tab === 'following' ? 'No updates from followed vendors yet' : 'No active updates right now'}
            </h2>
            <p className="text-sm text-gray-500">
              {tab === 'following'
                ? 'Follow your favorite hostel, mess, or stationery shop from Discover to track them here.'
                : 'Check back soon for fresh campus announcements.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((u) => (
              <article key={u.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      {UPDATE_TYPE_LABELS[u.updateType] || u.updateType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {CATEGORY_LABELS[u.businessCategory] || u.businessCategory}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(u.createdAt)}</span>
                </div>

                <Link
                  to={`/businesses/${u.businessId}`}
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  {u.businessName}
                </Link>

                <h2 className="text-lg font-bold text-gray-900 mt-1">{u.title}</h2>
                <p className="text-sm text-gray-700 mt-1">{u.content}</p>

                {u.offeringTitle && (
                  <p className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full">
                    Offering: {u.offeringTitle}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
