import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  OFFERING_TYPES,
  OFFERING_STATUSES,
  OFFERING_STATUS_COLORS,
  DAY_NAMES,
  UPDATE_TYPE_LABELS,
  formatPrice,
  formatTimeAgo,
} from '../utils/constants';

const PRICING_UNIT_OPTIONS = [
  { value: 'PER_MONTH', label: 'Per Month' },
  { value: 'PER_PLATE', label: 'Per Plate / Meal' },
  { value: 'PER_PAGE', label: 'Per Page' },
  { value: 'PER_PIECE', label: 'Per Piece / Item' },
  { value: 'PER_DAY', label: 'Per Day' },
  { value: 'PER_HOUR', label: 'Per Hour' },
];

const FRIENDLY_STATUS_LABELS = {
  AVAILABLE: '✅ Available',
  OCCUPIED: '🟡 Occupied / Full',
  SOLD_OUT: '❌ Sold Out',
  OUT_OF_STOCK: '🚫 Out of Stock',
  UNAVAILABLE: '⏸️ Temporarily Off',
  UNCONFIRMED: '❓ Needs Check',
};

const QUICK_FEATURE_TAGS = [
  { key: 'ac', label: '❄️ AC' },
  { key: 'wifi', label: '📶 Wi-Fi' },
  { key: 'veg', label: '🥗 Veg Only' },
  { key: 'delivery', label: '🛵 Home Delivery' },
  { key: 'color_print', label: '🖨️ Color Print' },
  { key: '24x7', label: '⏰ Open 24x7' },
];

const EXPIRY_OPTIONS = [
  { value: '12', label: 'Show for 12 hours' },
  { value: '24', label: 'Show for 24 hours (Today)' },
  { value: '72', label: 'Show for 3 days' },
  { value: '168', label: 'Show for 1 week' },
  { value: '0', label: 'Keep until I delete it' },
];

export default function VendorStudio({ business }) {
  const [activeTab, setActiveTab] = useState('offerings');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [offerings, setOfferings] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [schedule, setSchedule] = useState(() =>
    DAY_NAMES.map((_, dayOfWeek) => ({
      dayOfWeek,
      opensAt: '08:00',
      closesAt: '21:00',
      isClosed: dayOfWeek === 0,
    }))
  );

  // Add Offering state (no key=value jargon!)
  const [offeringType, setOfferingType] = useState('HOSTEL_ROOM');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [pricingUnit, setPricingUnit] = useState('PER_MONTH');
  const [selectedTags, setSelectedTags] = useState([]);
  const [extraNote, setExtraNote] = useState('');

  // Photo Upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Update Publish state
  const [updateType, setUpdateType] = useState('ANNOUNCEMENT');
  const [linkedOfferingId, setLinkedOfferingId] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [expiresHours, setExpiresHours] = useState('24');

  const loadStudioData = useCallback(async () => {
    try {
      const [offRes, hrsRes, phoRes, updRes] = await Promise.all([
        api.get(`/businesses/${business.id}/offerings`),
        api.get(`/businesses/${business.id}/hours`),
        api.get(`/businesses/${business.id}/photos`),
        api.get(`/businesses/${business.id}/updates`),
      ]);
      setOfferings(offRes.data);
      setPhotos(phoRes.data);
      setUpdates(updRes.data);

      if (hrsRes.data.schedule?.length > 0) {
        const byDay = Object.fromEntries(hrsRes.data.schedule.map((d) => [d.dayOfWeek, d]));
        setSchedule(
          DAY_NAMES.map((_, idx) => {
            const found = byDay[idx];
            if (!found) return { dayOfWeek: idx, opensAt: '08:00', closesAt: '21:00', isClosed: true };
            return {
              dayOfWeek: idx,
              opensAt: found.opensAt ? found.opensAt.slice(0, 5) : '08:00',
              closesAt: found.closesAt ? found.closesAt.slice(0, 5) : '21:00',
              isClosed: found.isClosed,
            };
          })
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your shop data.');
    }
  }, [business.id]);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  function notifySuccess(msg) {
    setError('');
    setFeedback(msg);
  }

  function toggleTag(key) {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function buildAttributesMap() {
    const map = {};
    selectedTags.forEach((tag) => {
      map[tag] = true;
    });
    if (extraNote.trim()) {
      map.details = extraNote.trim();
    }
    return map;
  }

  async function handleAddOffering(e) {
    e.preventDefault();
    setError('');
    setFeedback('');
    try {
      await api.post(`/businesses/${business.id}/offerings`, {
        offeringType,
        title,
        price: Number(price),
        pricingUnit,
        status: 'AVAILABLE',
        attributes: buildAttributesMap(),
      });
      setTitle('');
      setPrice('');
      setSelectedTags([]);
      setExtraNote('');
      notifySuccess('Item added to your shop list!');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add item.');
    }
  }

  async function handleOfferingStatus(offering, newStatus) {
    setError('');
    try {
      await api.put(`/offerings/${offering.id}`, {
        status: newStatus,
        expectedVersion: offering.version,
      });
      notifySuccess(`Updated "${offering.title}" to ${FRIENDLY_STATUS_LABELS[newStatus] || newStatus}.`);
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.');
    }
  }

  async function handleConfirmFresh(offeringId) {
    setError('');
    try {
      await api.patch(`/offerings/${offeringId}/confirm`);
      notifySuccess('Marked as confirmed available today!');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm availability.');
    }
  }

  async function handleDeleteOffering(offeringId) {
    setError('');
    try {
      await api.delete(`/offerings/${offeringId}`);
      notifySuccess('Item removed.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove item.');
    }
  }

  async function handleSaveHours(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = schedule.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        opensAt: d.isClosed ? null : `${d.opensAt}:00`,
        closesAt: d.isClosed ? null : `${d.closesAt}:00`,
        isClosed: d.isClosed,
      }));
      await api.put(`/businesses/${business.id}/hours`, { schedule: payload });
      notifySuccess('Opening hours saved!');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save opening hours.');
    }
  }

  async function handleUploadPhoto(e) {
    e.preventDefault();
    if (!photoFile) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      if (photoCaption.trim()) formData.append('caption', photoCaption.trim());
      await api.post(`/businesses/${business.id}/photos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoFile(null);
      setPhotoCaption('');
      notifySuccess('Photo added to your shop page!');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    setError('');
    try {
      await api.delete(`/businesses/${business.id}/photos/${photoId}`);
      notifySuccess('Photo removed.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove photo.');
    }
  }

  async function handlePublishUpdate(e) {
    e.preventDefault();
    setError('');
    try {
      const hrs = Number(expiresHours);
      const expiresAt = hrs > 0 ? new Date(Date.now() + hrs * 3600 * 1000).toISOString() : null;
      await api.post(`/businesses/${business.id}/updates`, {
        offeringId: linkedOfferingId || null,
        updateType,
        title: updateTitle,
        content: updateContent,
        expiresAt,
      });
      setUpdateTitle('');
      setUpdateContent('');
      notifySuccess('Notice posted! All nearby students can see it now.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post notice.');
    }
  }

  async function handleDeleteUpdate(updateId) {
    setError('');
    try {
      await api.delete(`/updates/${updateId}`);
      notifySuccess('Notice deleted.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete notice.');
    }
  }

  const tabs = [
    { id: 'offerings', label: `🏷️ Items & Prices (${offerings.length})` },
    { id: 'hours', label: '⏰ Opening Hours' },
    { id: 'photos', label: `📸 Photos (${photos.length})` },
    { id: 'updates', label: `📢 Post Notice (${updates.length})` },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            My Shop Manager
          </span>
          <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
          <p className="text-xs text-gray-500">{business.address}</p>
        </div>
        <Link
          to={`/businesses/${business.id}`}
          className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition self-start"
        >
          View Public Page →
        </Link>
      </div>

      {/* Simple Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-800">
          {feedback}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TAB 1: ITEMS & PRICES */}
      {activeTab === 'offerings' && (
        <div className="space-y-6">
          <form onSubmit={handleAddOffering} className="bg-emerald-50/50 rounded-xl p-4 sm:p-5 border border-emerald-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Add a Room, Meal Plan, or Item</h3>
              <p className="text-xs text-gray-600">
                Students search by price and features, so adding clear items brings more visitors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={offeringType}
                  onChange={(e) => setOfferingType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {OFFERING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item / Room Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Single AC Room / Veg Thali"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 8500"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Charged</label>
                <select
                  value={pricingUnit}
                  onChange={(e) => setPricingUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {PRICING_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tap-to-select Features instead of key=value syntax */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Tap matching features (optional):</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_FEATURE_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => toggleTag(tag.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="Any extra note? (e.g. Attached bathroom, 2 meals daily)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                + Add to List
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {offerings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No items added yet. Add your first room, meal, or service above!
              </p>
            ) : (
              offerings.map((o) => (
                <div
                  key={o.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{o.title}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          OFFERING_STATUS_COLORS[o.status] || 'bg-gray-100'
                        }`}
                      >
                        {FRIENDLY_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </div>
                    <p className="text-base font-bold text-emerald-700">
                      {formatPrice(o.price, o.pricingUnit)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last confirmed: {formatTimeAgo(o.lastConfirmedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={o.status}
                      onChange={(e) => handleOfferingStatus(o, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                    >
                      {OFFERING_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {FRIENDLY_STATUS_LABELS[st] || st}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleConfirmFresh(o.id)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      ✅ Still Available Today
                    </button>
                    <button
                      onClick={() => handleDeleteOffering(o.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OPENING HOURS */}
      {activeTab === 'hours' && (
        <form onSubmit={handleSaveHours} className="space-y-3">
          <p className="text-sm text-gray-600 mb-2">
            Set when your shop or mess is open so students know before walking over.
          </p>
          {schedule.map((entry, idx) => (
            <div
              key={entry.dayOfWeek}
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 border border-gray-200 rounded-xl"
            >
              <span className="w-28 font-semibold text-sm text-gray-800">
                {DAY_NAMES[entry.dayOfWeek]}
              </span>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.isClosed}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[idx] = { ...entry, isClosed: e.target.checked };
                    setSchedule(next);
                  }}
                />
                Closed all day
              </label>

              {!entry.isClosed && (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={entry.opensAt}
                    onChange={(e) => {
                      const next = [...schedule];
                      next[idx] = { ...entry, opensAt: e.target.value };
                      setSchedule(next);
                    }}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={entry.closesAt}
                    onChange={(e) => {
                      const next = [...schedule];
                      next[idx] = { ...entry, closesAt: e.target.value };
                      setSchedule(next);
                    }}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
          >
            Save Opening Hours
          </button>
        </form>
      )}

      {/* TAB 3: PHOTOS */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <form
            onSubmit={handleUploadPhoto}
            className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              required
              className="text-sm text-gray-700"
            />
            <input
              type="text"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="Short caption (e.g. Dining Hall)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full"
            />
            <button
              type="submit"
              disabled={uploading || !photoFile}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <img
                  src={p.publicUrl}
                  alt={p.caption || business.name}
                  className="w-full h-40 object-cover bg-gray-100"
                />
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{p.caption || 'Shop photo'}</span>
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TODAY'S NOTICE / UPDATE */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          <form onSubmit={handlePublishUpdate} className="bg-emerald-50/50 p-4 sm:p-5 rounded-xl border border-emerald-200 space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Send a Notice to Students</h3>
              <p className="text-xs text-gray-600">
                Announce today&apos;s lunch menu, a vacant room, or special holiday hours.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {Object.entries(UPDATE_TYPE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>{lbl}</option>
                ))}
              </select>
              <select
                value={linkedOfferingId}
                onChange={(e) => setLinkedOfferingId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">General shop notice</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>About: {o.title}</option>
                ))}
              </select>
              <select
                value={expiresHours}
                onChange={(e) => setExpiresHours(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="Title (e.g. Today's Lunch: Rajma Chawal & Paneer)"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            />
            <textarea
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="Write your message here..."
              rows={2}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 cursor-pointer"
            >
              📢 Post Notice Now
            </button>
          </form>

          <div className="space-y-3">
            {updates.map((u) => (
              <div
                key={u.id}
                className="p-4 border border-gray-200 rounded-xl flex items-start justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-semibold text-emerald-700">
                    {UPDATE_TYPE_LABELS[u.updateType] || u.updateType}
                  </span>
                  <h4 className="font-semibold text-gray-900">{u.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{u.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteUpdate(u.id)}
                  className="text-xs text-red-600 font-semibold hover:underline cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
