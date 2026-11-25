import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VendorStudio from '../components/VendorStudio';
import AdminModerationPanel from '../components/AdminModerationPanel';
import { CATEGORIES, CATEGORY_LABELS, DEFAULT_CAMPUS_COORDS } from '../utils/constants';

export default function DashboardPage() {
  const { user, checkAuth } = useAuth();
  const [myBusiness, setMyBusiness] = useState(null);
  const [follows, setFollows] = useState([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  // Business Onboarding Form
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('HOSTEL_PG');
  const [bizDesc, setBizDesc] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizLat, setBizLat] = useState(String(DEFAULT_CAMPUS_COORDS.lat));
  const [bizLng, setBizLng] = useState(String(DEFAULT_CAMPUS_COORDS.lng));
  const [bizPhone, setBizPhone] = useState('');
  const [bizError, setBizError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoadingBiz(true);
    try {
      const followsRes = await api.get('/follows/my');
      setFollows(followsRes.data);
    } catch {
      setFollows([]);
    }

    try {
      const bizRes = await api.get('/businesses/my');
      setMyBusiness(bizRes.data);
    } catch {
      setMyBusiness(null);
    } finally {
      setLoadingBiz(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, loadDashboard]);

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setBizError('');
    try {
      const res = await api.post('/businesses', {
        name: bizName,
        category: bizCategory,
        description: bizDesc,
        address: bizAddress,
        latitude: Number(bizLat),
        longitude: Number(bizLng),
        phone: bizPhone || undefined,
        whatsapp: bizPhone || undefined,
      });
      setMyBusiness(res.data);
      await checkAuth();
    } catch (err) {
      setBizError(err.response?.data?.message || 'Failed to register business.');
    }
  }

  function handleFillGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setBizLat(pos.coords.latitude.toFixed(6));
      setBizLng(pos.coords.longitude.toFixed(6));
    });
  }

  if (!user) return null;

  const roleBadge = {
    STUDENT: 'bg-blue-100 text-blue-700',
    VENDOR: 'bg-emerald-100 text-emerald-700',
    ADMIN: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Summary */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role] || 'bg-gray-100'}`}>
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/" className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-800">
              Explore Services
            </Link>
            <Link to="/feed" className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-sm font-medium text-indigo-700">
              My Following Feed
            </Link>
          </div>
        </section>

        {/* Followed Businesses */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Followed Businesses ({follows.length})
          </h2>
          {follows.length === 0 ? (
            <p className="text-sm text-gray-500">
              You are not following any businesses yet. Visit <Link to="/" className="text-indigo-600 underline">Discover</Link> to follow nearby services.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {follows.map((f) => (
                <Link
                  key={f.businessId}
                  to={`/businesses/${f.businessId}`}
                  className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition bg-gray-50"
                >
                  <p className="text-xs font-semibold text-indigo-600">
                    {CATEGORY_LABELS[f.category] || f.category}
                  </p>
                  <p className="font-semibold text-gray-900">{f.businessName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{f.address}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Vendor Studio OR Business Onboarding */}
        {loadingBiz ? (
          <div className="h-40 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        ) : myBusiness ? (
          <VendorStudio business={myBusiness} />
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Register Your Campus Business</h2>
            <p className="text-sm text-gray-500 mb-5">
              Own a hostel, PG, mess, print shop, kirana store, or study library? List it on NearBuzz to reach nearby students.
            </p>

            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="Business Name"
                  required
                  className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                />
                <select
                  value={bizCategory}
                  onChange={(e) => setBizCategory(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                >
                  {CATEGORIES.filter((c) => c.value).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                placeholder="Full Address near campus"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
              />

              <textarea
                value={bizDesc}
                onChange={(e) => setBizDesc(e.target.value)}
                placeholder="Short description of facilities..."
                rows={2}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <input
                  type="number"
                  step="any"
                  value={bizLat}
                  onChange={(e) => setBizLat(e.target.value)}
                  placeholder="Latitude"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <input
                  type="number"
                  step="any"
                  value={bizLng}
                  onChange={(e) => setBizLng(e.target.value)}
                  placeholder="Longitude"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <input
                  type="text"
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  placeholder="Phone / WhatsApp (+91...)"
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={handleFillGps}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  Use Current GPS
                </button>
              </div>

              {bizError && (
                <p className="text-sm text-red-600">{bizError}</p>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Create Listing & Open Vendor Studio
              </button>
            </form>
          </section>
        )}

        {/* Admin Panel (only visible to ROLE_ADMIN) */}
        {user.role === 'ADMIN' && <AdminModerationPanel />}
      </main>
    </div>
  );
}
