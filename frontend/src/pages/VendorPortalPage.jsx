import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import Navbar from '../components/Navbar';
import VendorStudio from '../components/VendorStudio';
import LocationPickerMap from '../components/LocationPickerMap';
import { VENDOR_CATEGORY_CONFIG } from '../utils/constants';

const CATEGORY_KEYS = Object.keys(VENDOR_CATEGORY_CONFIG);

/**
 * VendorPortalPage — Shop Owner portal with category-first 3-step onboarding:
 *   Step 1: Pick service type out of the 6 campus categories
 *   Step 2: Fill service-specific shop profile fields (without asking for all items yet)
 *   Step 3: Enter street address and pin exact shop location (GPS / Map Pin / Manual Coords)
 */
export default function VendorPortalPage() {
  const { user, checkAuth } = useAuth();
  const { coords } = useLocationContext();
  const navigate = useNavigate();

  const [myBusiness, setMyBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);

  // 3-step onboarding state
  const [step, setStep] = useState(1);
  const [bizCategory, setBizCategory] = useState('HOSTEL_PG');
  const [bizName, setBizName] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizNote, setBizNote] = useState('');
  const [categoryAnswers, setCategoryAnswers] = useState({});
  const [bizAddress, setBizAddress] = useState('');
  const [bizLat, setBizLat] = useState(String(coords.lat));
  const [bizLng, setBizLng] = useState(String(coords.lng));
  const [locationSource, setLocationSource] = useState(coords.source === 'gps' ? 'gps' : '');
  const [bizError, setBizError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync detected GPS into onboarding if vendor hasn't manually pinned yet
  useEffect(() => {
    if (coords.source === 'gps' && !locationSource) {
      setBizLat(String(coords.lat));
      setBizLng(String(coords.lng));
      setLocationSource('gps');
    }
  }, [coords, locationSource]);

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

  function selectCategory(catKey) {
    setBizCategory(catKey);
    const cfg = VENDOR_CATEGORY_CONFIG[catKey];
    const defaults = {};
    cfg.fields.forEach((f) => {
      if (f.type === 'select' && f.options?.length) {
        defaults[f.key] = f.options[0];
      } else {
        defaults[f.key] = '';
      }
    });
    setCategoryAnswers(defaults);
    setStep(2);
  }

  function buildCombinedDescription() {
    const cfg = VENDOR_CATEGORY_CONFIG[bizCategory];
    const parts = [];
    cfg.fields.forEach((f) => {
      const val = categoryAnswers[f.key];
      if (val && String(val).trim()) {
        parts.push(`${f.label.replace(/\?$/, '')}: ${String(val).trim()}`);
      }
    });
    if (bizNote.trim()) {
      parts.push(bizNote.trim());
    }
    return parts.join(' | ');
  }

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setBizError('');
    setSubmitting(true);
    try {
      const res = await api.post('/businesses', {
        name: bizName,
        category: bizCategory,
        description: buildCombinedDescription(),
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

  if (!user) return null;

  const activeConfig = VENDOR_CATEGORY_CONFIG[bizCategory];

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

        {loadingBiz ? (
          <div className="h-44 bg-white rounded-2xl border border-emerald-100 animate-pulse" />
        ) : myBusiness ? (
          <>
            {/* Helpful guide strip for newly registered shop owners */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="font-semibold text-emerald-800">
                ✓ Shop Profile & Location Active
              </span>
              <span className="text-gray-600">
                Use the tabs below anytime to add <strong>Items & Prices</strong>, set <strong>Opening Hours</strong>, upload <strong>Photos</strong>, or update your <strong>GPS Pin</strong>.
              </span>
            </div>
            <VendorStudio business={myBusiness} onBusinessUpdated={setMyBusiness} />
          </>
        ) : (
          /* 3-STEP CATEGORY-FIRST VENDOR ONBOARDING */
          <section className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 sm:p-8">
            {/* Step Progress Pill */}
            <div className="flex items-center justify-center gap-2 mb-6 text-xs font-semibold">
              {[
                { num: 1, label: '1. Service Type' },
                { num: 2, label: '2. Shop Info' },
                { num: 3, label: '3. Address & Location' },
              ].map((s) => (
                <span
                  key={s.num}
                  className={`px-3 py-1.5 rounded-full ${
                    step === s.num
                      ? 'bg-emerald-600 text-white'
                      : step > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step > s.num ? `✓ ${s.label.slice(3)}` : s.label}
                </span>
              ))}
            </div>

            {/* STEP 1: Pick out of the 6 Services */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Which service does your shop offer?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Tap one option below — we will customize the setup form for your business.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CATEGORY_KEYS.map((key) => {
                    const cfg = VENDOR_CATEGORY_CONFIG[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectCategory(key)}
                        className="p-5 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition cursor-pointer group"
                      >
                        <span className="text-3xl block mb-2">{cfg.icon}</span>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-800">
                          {cfg.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{cfg.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Category-Specific Shop Details (without asking for all items yet) */}
            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(3);
                }}
                className="max-w-2xl mx-auto space-y-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {activeConfig.icon} {activeConfig.title}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">Tell students about your shop</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Change Service Type
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder={activeConfig.namePlaceholder}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Category-tailored guided fields */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                    {activeConfig.title} Highlights
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeConfig.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={categoryAnswers[field.key] || ''}
                            onChange={(e) =>
                              setCategoryAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={categoryAnswers[field.key] || ''}
                            onChange={(e) =>
                              setCategoryAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Anything else students should know? (optional)
                  </label>
                  <input
                    type="text"
                    value={bizNote}
                    onChange={(e) => setBizNote(e.target.value)}
                    placeholder={activeConfig.notePlaceholder}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Next: Set Address & Location →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Address + Current GPS / Map Pin / Manual Coordinates */}
            {step === 3 && (
              <form onSubmit={handleCreateBusiness} className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {activeConfig.icon} {bizName}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">Where is your shop located?</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ← Edit Shop Info
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Full Street Address & Landmark *
                  </label>
                  <input
                    type="text"
                    value={bizAddress}
                    onChange={(e) => setBizAddress(e.target.value)}
                    placeholder={activeConfig.addressPlaceholder}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <LocationPickerMap
                  lat={bizLat}
                  lng={bizLng}
                  locationConfirmed={locationSource}
                  onConfirmSource={setLocationSource}
                  onChange={(nextLat, nextLng) => {
                    setBizLat(nextLat);
                    setBizLng(nextLng);
                  }}
                />

                {bizError && <p className="text-sm text-red-600">{bizError}</p>}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creating Your Shop...' : 'Finish & Open My Shop →'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
