import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_BADGE_COLORS,
  DEFAULT_CAMPUS_COORDS,
  formatDistance,
  formatPrice,
} from '../utils/constants';

const QUICK_SEARCH_EXAMPLES = [
  'AC room under 9000',
  'Veg tiffin nearby',
  'Study library',
];

export default function ExplorePage() {
  const { user } = useAuth();
  const [coords, setCoords] = useState({
    lat: DEFAULT_CAMPUS_COORDS.lat,
    lng: DEFAULT_CAMPUS_COORDS.lng,
    label: DEFAULT_CAMPUS_COORDS.label,
  });
  const [radius, setRadius] = useState(2000);
  const [category, setCategory] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { lat: coords.lat, lng: coords.lng, radius };
      if (category) params.category = category;
      const res = await api.get('/businesses/nearby', { params });
      setBusinesses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load nearby services.');
    } finally {
      setLoading(false);
    }
  }, [coords.lat, coords.lng, radius, category]);

  useEffect(() => {
    if (!aiResult) {
      fetchNearby();
    }
  }, [fetchNearby, aiResult]);

  async function runSmartSearch(queryText) {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setAiResult(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/ai/search', {
        params: { query: trimmed, lat: coords.lat, lng: coords.lng },
      });
      setAiResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAiSearch(e) {
    e.preventDefault();
    await runSmartSearch(aiQuery);
  }

  function handleExampleSearch(example) {
    setAiQuery(example);
    runSmartSearch(example);
  }

  function clearAiSearch() {
    setAiQuery('');
    setAiResult(null);
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setError('Location access is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          label: 'Your Current Location',
        });
        setLocating(false);
      },
      () => {
        setError('Could not read GPS permission. Showing results near campus.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Vendor Quick-Jump Banner — so older shop owners never feel lost if they land on Discover */}
      {user?.role === 'VENDOR' && (
        <div className="bg-emerald-700 text-white border-b border-emerald-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-medium">
              🏪 Signed in as a <strong className="font-bold">Shop Owner</strong> — update your room status, menu, photos, or timings anytime.
            </p>
            <Link
              to="/vendor"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-emerald-800 text-sm font-bold hover:bg-emerald-50 transition shrink-0"
            >
              Open My Shop Portal →
            </Link>
          </div>
        </div>
      )}

      {/* Hero + Smart Search */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Find hostels, mess plans, print shops & libraries near your campus
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base mb-6">
              See real room availability, today&apos;s mess menu, and shop timings updated directly by local owners.
            </p>

            <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder='Search naturally, e.g. "AC room under 9000"'
                className="flex-1 px-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold transition shadow-sm cursor-pointer"
              >
                🔍 Search
              </button>
              {aiResult && (
                <button
                  type="button"
                  onClick={clearAiSearch}
                  className="px-4 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium transition cursor-pointer"
                >
                  Show All
                </button>
              )}
            </form>

            {/* One-tap example queries for non-tech users */}
            {!aiResult && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-indigo-100">
                <span className="opacity-80">Try tapping:</span>
                {QUICK_SEARCH_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => handleExampleSearch(example)}
                    className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            {/* Location + Radius Controls */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-100">
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg">
                📍 Near: <strong className="text-white">{coords.label}</strong>
              </span>

              <button
                type="button"
                onClick={handleUseGps}
                disabled={locating}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
              >
                {locating ? 'Finding location...' : 'Use My GPS'}
              </button>

              {!aiResult && (
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  aria-label="Search radius"
                  className="bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium outline-none cursor-pointer"
                >
                  <option value={500} className="text-gray-900">Within 500 m</option>
                  <option value={1000} className="text-gray-900">Within 1 km</option>
                  <option value={2000} className="text-gray-900">Within 2 km</option>
                  <option value={5000} className="text-gray-900">Within 5 km</option>
                  <option value={10000} className="text-gray-900">Within 10 km</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filter Pills */}
        {!aiResult && (
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value || 'ALL'}
                  onClick={() => setCategory(c.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Smart Search Filter Banner */}
        {aiResult && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-indigo-900">Showing results for:</span>
              {aiResult.interpretedIntent.category && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 font-medium">
                  {CATEGORY_LABELS[aiResult.interpretedIntent.category] || aiResult.interpretedIntent.category}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                Within {aiResult.interpretedIntent.radiusMeters} m
              </span>
              {aiResult.interpretedIntent.maxPrice != null && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200 font-medium">
                  Under ₹{aiResult.interpretedIntent.maxPrice}
                </span>
              )}
              {aiResult.interpretedIntent.keywords?.map((kw) => (
                <span key={kw} className="px-2.5 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200">
                  {kw}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={clearAiSearch}
              className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-white border border-gray-200 animate-pulse p-6" />
            ))}
          </div>
        ) : aiResult ? (
          aiResult.results.length === 0 ? (
            <EmptyState
              title="No matching places found"
              subtitle="Try a higher budget, wider distance, or browse all nearby services."
              action={
                <button
                  onClick={clearAiSearch}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium cursor-pointer"
                >
                  Browse All Nearby
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {aiResult.results.map(({ business, matchingOfferings }) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  offerings={matchingOfferings}
                />
              ))}
            </div>
          )
        ) : businesses.length === 0 ? (
          <EmptyState
            title="No services found within this distance"
            subtitle="Try increasing the distance filter or selecting All Services."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {businesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BusinessCard({ business, offerings }) {
  const badgeColor = CATEGORY_BADGE_COLORS[business.category] || 'bg-gray-100 text-gray-700';

  return (
    <Link
      to={`/businesses/${business.id}`}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition p-5 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            {CATEGORY_LABELS[business.category] || business.category}
          </span>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {formatDistance(business.distanceMeters)}
          </span>
        </div>

        <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition mb-1">
          {business.name}
        </h2>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{business.address}</p>

        {business.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{business.description}</p>
        )}

        {offerings && offerings.length > 0 && (
          <div className="mb-4 space-y-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Matching Prices
            </p>
            {offerings.slice(0, 2).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-800 truncate pr-2">{o.title}</span>
                <span className="font-semibold text-emerald-700 whitespace-nowrap">
                  {formatPrice(o.price, o.pricingUnit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {business.verificationStatus === 'VERIFIED' ? 'Verified Shop' : business.verificationStatus}
        </span>
        <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">
          See Prices & Hours →
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ title, subtitle, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{subtitle}</p>
      {action}
    </div>
  );
}
