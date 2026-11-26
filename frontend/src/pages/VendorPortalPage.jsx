import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VendorStudio from '../components/VendorStudio';
import { CATEGORIES, DEFAULT_CAMPUS_COORDS } from '../utils/constants';

/**
 * VendorPortalPage — Shop Owner portal with calm emerald theme and plain language
 * tailored for non-technical business owners (hostels, messes, print & kirana shops).
 */
export default function VendorPortalPage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [myBusiness, setMyBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);

  // Business Onboarding Form
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('HOSTEL_PG');
  const [bizDesc, setBizDesc] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizLat, setBizLat] = useState(String(DEFAULT_CAMPUS_COORDS.lat));
  const [bizLng, setBizLng] = useState(String(DEFAULT_CAMPUS_COORDS.lng));
  const [gpsStatus, setGpsStatus] = useState('default'); // 'default' | 'detecting' | 'detected' | 'error'
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [bizPhone, setBizPhone] = useState('');
  const [bizError, setBizError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBusiness = useCallback(async () => {
    setLoadingBiz(true);
    try {
      const res = await api.get('/businesses/my');
      setMyBusiness(res.data);
    } catch {
      setMyBusiness(null);
    } finally {
      setLoadingBiz(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadBusiness();
  }, [user, loadBusiness]);

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setBizError('');
    setSubmitting(true);
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
      navigate('/vendor', { replace: true });
    } catch (err) {
      setBizError(err.response?.data?.message || 'Could not register your shop. Please check the details.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFillGps() {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBizLat(pos.coords.latitude.toFixed(6));
        setBizLng(pos.coords.longitude.toFixed(6));
        setGpsStatus('detected');
      },
      () => {
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Vendor Profile Header */}
        <section className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
                🏪
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{user.name || 'Shop Owner'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Shop Owner
                  </span>
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {myBusiness && (
                <Link
                  to={`/businesses/${myBusiness.id}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition"
                >
                  👀 Preview What Students See
                </Link>
              )}
              <Link
                to="/"
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition"
              >
                Browse Nearby Shops
              </Link>
            </div>
          </div>
        </section>

        {/* Business Content */}
        {loadingBiz ? (
          <div className="h-44 bg-white rounded-2xl border border-emerald-100 animate-pulse" />
        ) : myBusiness ? (
          <VendorStudio business={myBusiness} onBusinessUpdated={setMyBusiness} />
        ) : (
          /* Simple 1-Page Shop Onboarding for Non-Tech Owners */
          <section className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🏪</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Set Up Your Shop Page</h2>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Fill in these basic details once. Nearby students will immediately see your shop, prices, and timings.
              </p>
            </div>

            <form onSubmit={handleCreateBusiness} className="max-w-2xl mx-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Shop / Hostel / Mess Name *
                  </label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Sharma Boys Hostel"
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    What kind of place is this? *
                  </label>
                  <select
                    value={bizCategory}
                    onChange={(e) => setBizCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  placeholder="e.g. Gate No. 2, Knowledge Park II, Greater Noida"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone or WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Short Note for Students
                  </label>
                  <input
                    type="text"
                    value={bizDesc}
                    onChange={(e) => setBizDesc(e.target.value)}
                    placeholder="e.g. Home-style meals, Wi-Fi, 24x7 water"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Friendly GPS Box instead of intimidating lat/lng numbers */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Shop Map Location
                    </p>
                    <p className="text-xs text-gray-600">
                      {gpsStatus === 'detected'
                        ? '✓ Exact phone GPS location saved!'
                        : gpsStatus === 'error'
                        ? 'Could not read GPS — using default campus area.'
                        : 'Tap the button when you are at your shop so students can find the exact distance.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillGps}
                    disabled={gpsStatus === 'detecting'}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shrink-0"
                  >
                    {gpsStatus === 'detecting' ? 'Detecting...' : '📍 Detect My Location'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualCoords((prev) => !prev)}
                  className="text-xs text-emerald-800 underline cursor-pointer"
                >
                  {showManualCoords ? 'Hide manual coordinates' : 'Advanced: Enter coordinates manually'}
                </button>

                {showManualCoords && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={bizLat}
                        onChange={(e) => setBizLat(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={bizLng}
                        onChange={(e) => setBizLng(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {bizError && <p className="text-sm text-red-600">{bizError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-base font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition"
              >
                {submitting ? 'Creating your shop...' : 'Save & Open My Shop Manager →'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
