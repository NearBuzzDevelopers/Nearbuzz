import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import Navbar from '../components/Navbar';
import VendorStudio from '../components/VendorStudio';
import { LocationPickerMap, StudentPreviewModal } from '../components/vendor';
import {
  CATEGORY_TO_BUSINESS_TYPE,
  VENDOR_CATEGORY_CONFIG,
  getBusinessType,
  vendorDashboardPath,
} from '../utils/constants';

const CATEGORY_KEYS = Object.keys(VENDOR_CATEGORY_CONFIG);

/**
 * VendorPortalPage — Shop Owner portal with category-first onboarding and automatic
 * routing to `/vendor/{businessType}` (`hostel`, `mess`, `printing`, `books`, `kirana`, `library`).
 */
export default function VendorPortalPage() {
  const { user, checkAuth } = useAuth();
  const { coords } = useLocationContext();
  const { businessType: routeType } = useParams();
  const navigate = useNavigate();

  const [myBusiness, setMyBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // Automatically route returning shop owners to their exact `/vendor/{businessType}` dashboard
  useEffect(() => {
    if (loadingBiz || !myBusiness) return;
    const actualType = getBusinessType(myBusiness);
    if (routeType !== actualType) {
      navigate(vendorDashboardPath(actualType), { replace: true });
    }
  }, [loadingBiz, myBusiness, routeType, navigate]);

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
    const selectedBusinessType = CATEGORY_TO_BUSINESS_TYPE[bizCategory];
    try {
      const res = await api.post('/businesses', {
        name: bizName,
        category: bizCategory,
        businessType: selectedBusinessType,
        description: buildCombinedDescription(),
        address: bizAddress,
        latitude: Number(bizLat),
        longitude: Number(bizLng),
        phone: bizPhone || undefined,
        whatsapp: bizPhone || undefined,
        metadata: {
          ...categoryAnswers,
        },
      });
      setMyBusiness(res.data);
      await checkAuth();
      navigate(vendorDashboardPath(getBusinessType(res.data)), { replace: true });
    } catch (err) {
      setBizError(err.response?.data?.message || 'Could not register your shop. Please check the details.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  const activeConfig = VENDOR_CATEGORY_CONFIG[bizCategory];
  const myCategoryConfig = myBusiness ? VENDOR_CATEGORY_CONFIG[myBusiness.category] : null;
  const myBusinessType = getBusinessType(myBusiness);

  return (
    <div className="min-h-screen bg-[#F4FBF7] text-[#0F172A]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Emerald Vendor Portal Header Strip */}
        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-3xl shrink-0">
                {myCategoryConfig?.icon || '🏪'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold text-[#0F172A]">
                    {myBusiness ? myBusiness.name : user.name || 'Shop Owner'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-emerald-200">
                    {myBusiness
                      ? `${myCategoryConfig?.title || myBusinessType} (${myBusinessType})`
                      : 'New Shop Setup'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">
                  {myBusiness ? `📍 ${myBusiness.address}` : user.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {myBusiness && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-sm font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <span>👀</span>
                  <span>Preview What Students See</span>
                </button>
              )}
              <Link
                to="/"
                className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 flex items-center transition"
              >
                Browse Nearby
              </Link>
            </div>
          </div>
        </section>

        {loadingBiz ? (
          <div className="h-44 bg-white rounded-2xl border border-emerald-100 animate-pulse" />
        ) : myBusiness ? (
          <>
            <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="font-bold text-[#047857]">
                ✓ Routed to /vendor/{myBusinessType} — Shop Profile Active
              </span>
              <span className="text-slate-600">
                Shared Emerald tools ready below: Weekly Hours, Notice Composer (Voice + Templates), GPS Pin &amp; Student Preview.
              </span>
            </div>

            <VendorStudio business={myBusiness} onBusinessUpdated={setMyBusiness} />

            <StudentPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              business={myBusiness}
            >
              <div className="bg-white rounded-2xl border border-indigo-100 p-5 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  Live Student Page Preview for {myBusiness.name}
                </p>
                <Link
                  to={`/businesses/${myBusiness.id}`}
                  className="inline-block px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100"
                >
                  Open Full Public Listing →
                </Link>
              </div>
            </StudentPreviewModal>
          </>
        ) : (
          /* 3-STEP CATEGORY-FIRST VENDOR ONBOARDING */
          <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-8">
            <div className="flex items-center justify-center gap-2 mb-6 text-xs font-bold">
              {[
                { num: 1, label: '1. Business Type' },
                { num: 2, label: '2. Shop Info' },
                { num: 3, label: '3. Address & GPS' },
              ].map((s) => (
                <span
                  key={s.num}
                  className={`px-3.5 py-1.5 rounded-full ${step === s.num
                    ? 'bg-[#059669] text-white'
                    : step > s.num
                      ? 'bg-[#ECFDF5] text-[#047857] border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  {step > s.num ? `✓ ${s.label.slice(3)}` : s.label}
                </span>
              ))}
            </div>

            {/* STEP 1: Pick 1 of the 6 business types */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-[#0F172A] mb-1">
                    Which type of shop or service do you run?
                  </h2>
                  <p className="text-sm text-slate-600">
                    Choose once — every future login will automatically open your own dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CATEGORY_KEYS.map((key) => {
                    const cfg = VENDOR_CATEGORY_CONFIG[key];
                    const slug = CATEGORY_TO_BUSINESS_TYPE[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectCategory(key)}
                        className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5]/60 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{cfg.icon}</span>
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-[#047857]">
                            {slug}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#0F172A] group-hover:text-[#047857]">
                          {cfg.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{cfg.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Category-specific shop profile fields */}
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
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857]">
                      {activeConfig.icon} {activeConfig.title} ({CATEGORY_TO_BUSINESS_TYPE[bizCategory]})
                    </span>
                    <h2 className="text-xl font-extrabold text-[#0F172A]">Tell students about your shop</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-[#047857] hover:underline cursor-pointer"
                  >
                    Change Business Type
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#0F172A] mb-1">
                      Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder={activeConfig.namePlaceholder}
                      required
                      className="w-full min-h-[48px] px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#059669]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#0F172A] mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full min-h-[48px] px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#059669]"
                    />
                  </div>
                </div>

                <div className="bg-[#ECFDF5]/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                    {activeConfig.title} Highlights
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeConfig.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={categoryAnswers[field.key] || ''}
                            onChange={(e) =>
                              setCategoryAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-[#059669]"
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
                            className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-[#059669]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1">
                    Anything else students should know? (optional)
                  </label>
                  <input
                    type="text"
                    value={bizNote}
                    onChange={(e) => setBizNote(e.target.value)}
                    placeholder={activeConfig.notePlaceholder}
                    className="w-full min-h-[48px] px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#059669]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-h-[46px] px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="min-h-[48px] px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl text-sm font-extrabold cursor-pointer transition"
                  >
                    Next: Set Address &amp; Location →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Address + Interactive Emerald Map Pin Picker */}
            {step === 3 && (
              <form onSubmit={handleCreateBusiness} className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857]">
                      {activeConfig.icon} {bizName}
                    </span>
                    <h2 className="text-xl font-extrabold text-[#0F172A]">Where is your shop located?</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-[#047857] hover:underline cursor-pointer"
                  >
                    ← Edit Shop Info
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0F172A] mb-1">
                    Full Street Address &amp; Landmark *
                  </label>
                  <input
                    type="text"
                    value={bizAddress}
                    onChange={(e) => setBizAddress(e.target.value)}
                    placeholder={activeConfig.addressPlaceholder}
                    required
                    className="w-full min-h-[48px] px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#059669]"
                  />
                </div>

                <LocationPickerMap
                  lat={bizLat}
                  lng={bizLng}
                  pinLabel={activeConfig.title}
                  locationConfirmed={locationSource}
                  onConfirmSource={setLocationSource}
                  onChange={(nextLat, nextLng) => {
                    setBizLat(nextLat);
                    setBizLng(nextLng);
                  }}
                />

                {bizError && <p className="text-sm font-semibold text-red-600">{bizError}</p>}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="min-h-[46px] px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[50px] px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl text-sm font-extrabold cursor-pointer disabled:opacity-50 transition"
                  >
                    {submitting ? 'Saving Your Shop...' : 'Save Shop & Open Dashboard →'}
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
