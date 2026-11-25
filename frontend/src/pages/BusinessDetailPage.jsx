import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  CATEGORY_LABELS,
  CATEGORY_BADGE_COLORS,
  OFFERING_STATUS_COLORS,
  UPDATE_TYPE_LABELS,
  formatPrice,
  formatTimeAgo,
} from '../utils/constants';

export default function BusinessDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [scheduleData, setScheduleData] = useState({ openNow: false, schedule: [] });
  const [photos, setPhotos] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [followState, setFollowState] = useState({ following: false, followerCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  // Report modal state
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('INACCURATE_INFO');
  const [reportDesc, setReportDesc] = useState('');
  const [reportFeedback, setReportFeedback] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [
        api.get(`/businesses/${id}`),
        api.get(`/businesses/${id}/offerings`),
        api.get(`/businesses/${id}/hours`),
        api.get(`/businesses/${id}/photos`),
        api.get(`/businesses/${id}/updates`),
        api.get(`/businesses/${id}/followers/count`),
      ];
      if (user) {
        requests.push(api.get(`/businesses/${id}/follow/status`));
      }

      const results = await Promise.all(requests);
      setBusiness(results[0].data);
      setOfferings(results[1].data);
      setScheduleData(results[2].data);
      setPhotos(results[3].data);
      setUpdates(results[4].data);
      setFollowState(
        user
          ? results[6].data
          : { following: false, followerCount: results[5].data.followerCount }
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load business details.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleFollowToggle() {
    if (!user) {
      navigate('/login', { state: { from: `/businesses/${id}` } });
      return;
    }
    setFollowLoading(true);
    try {
      const res = followState.following
        ? await api.delete(`/businesses/${id}/follow`)
        : await api.post(`/businesses/${id}/follow`);
      setFollowState(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleSubmitReport(e) {
    e.preventDefault();
    setReportFeedback('');
    try {
      await api.post(`/businesses/${id}/reports`, {
        reason: reportReason,
        description: reportDesc,
      });
      setReportFeedback('Report submitted. Our moderation team will review it.');
      setReportDesc('');
    } catch (err) {
      setReportFeedback(err.response?.data?.message || 'Failed to submit report.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-10">
          <div className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </main>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Business not found.'}</p>
          <Link to="/" className="text-indigo-600 font-medium hover:underline">
            ← Back to Discover
          </Link>
        </main>
      </div>
    );
  }

  const badgeColor = CATEGORY_BADGE_COLORS[business.category] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link to="/" className="inline-block text-sm font-medium text-indigo-600 hover:underline">
          ← Back to Nearby Services
        </Link>

        {/* Header Profile Card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                  {CATEGORY_LABELS[business.category] || business.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    scheduleData.openNow
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {scheduleData.openNow ? 'Open Now' : 'Closed / Hours Unset'}
                </span>
                {business.verificationStatus === 'VERIFIED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Verified
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
              <p className="text-sm text-gray-600 mb-2">{business.address}</p>
              {business.description && (
                <p className="text-sm text-gray-700 max-w-2xl">{business.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
                  >
                    Call: {business.phone}
                  </a>
                )}
                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition"
                  >
                    WhatsApp Vendor
                  </a>
                )}
              </div>
            </div>

            {/* Follow + Report Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer ${
                  followState.following
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
              >
                {followState.following ? 'Following' : '+ Follow'} ({followState.followerCount})
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: `/businesses/${id}` } });
                    return;
                  }
                  setShowReport(!showReport);
                }}
                className="text-xs text-gray-500 hover:text-red-600 underline cursor-pointer"
              >
                Report inaccurate listing
              </button>
            </div>
          </div>

          {/* Inline Report Form */}
          {showReport && (
            <form onSubmit={handleSubmitReport} className="mt-6 pt-5 border-t border-gray-200 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Report Listing Issue</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="INACCURATE_INFO">Outdated / Wrong Price or Info</option>
                  <option value="PERMANENTLY_CLOSED">Permanently Closed</option>
                  <option value="SPAM_OR_FAKE">Fake or Duplicate Listing</option>
                </select>
                <input
                  type="text"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Optional details for admin..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
              {reportFeedback && (
                <p className="text-xs text-indigo-700 font-medium">{reportFeedback}</p>
              )}
            </form>
          )}
        </section>

        {/* Gallery Photos */}
        {photos.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Photos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img
                    src={photo.publicUrl}
                    alt={photo.caption || business.name}
                    className="w-full h-44 object-cover"
                  />
                  {photo.caption && (
                    <p className="p-2.5 text-xs text-gray-600 bg-white">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Offerings & Live Availability */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Offerings & Live Availability ({offerings.length})
          </h2>
          {offerings.length === 0 ? (
            <p className="text-sm text-gray-500">No rooms, menus, or rate cards published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offerings.map((o) => (
                <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{o.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          OFFERING_STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-indigo-700 mb-3">
                      {formatPrice(o.price, o.pricingUnit)}
                    </p>

                    {o.attributes && Object.keys(o.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {Object.entries(o.attributes).map(([key, val]) => (
                          <span
                            key={key}
                            className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700"
                          >
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Confirmed {formatTimeAgo(o.lastConfirmedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Operating Hours + Vendor Updates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Hours</h2>
            {scheduleData.schedule.length === 0 ? (
              <p className="text-sm text-gray-500">Operating hours not posted yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {scheduleData.schedule.map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{d.dayName}</span>
                    {d.isClosed ? (
                      <span className="text-red-600 font-medium">Closed</span>
                    ) : (
                      <span className="text-gray-600">
                        {d.opensAt?.slice(0, 5)} – {d.closesAt?.slice(0, 5)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Updates</h2>
            {updates.length === 0 ? (
              <p className="text-sm text-gray-500">No active announcements from this vendor.</p>
            ) : (
              <div className="space-y-3">
                {updates.map((u) => (
                  <div key={u.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-indigo-700">
                        {UPDATE_TYPE_LABELS[u.updateType] || u.updateType}
                      </span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(u.createdAt)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{u.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{u.content}</p>
                    {u.offeringTitle && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1.5">
                        Linked to: {u.offeringTitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
