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

  // Add Offering state
  const [offeringType, setOfferingType] = useState('HOSTEL_ROOM');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [pricingUnit, setPricingUnit] = useState('PER_MONTH');
  const [attrText, setAttrText] = useState('ac=true, wifi=true');

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
      setError(err.response?.data?.message || 'Failed to load vendor studio data.');
    }
  }, [business.id]);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  function notifySuccess(msg) {
    setError('');
    setFeedback(msg);
  }

  function parseAttributes(text) {
    const map = {};
    if (!text.trim()) return map;
    text.split(',').forEach((pair) => {
      const [rawK, rawV] = pair.split('=');
      if (!rawK || rawV === undefined) return;
      const k = rawK.trim();
      const v = rawV.trim();
      if (!k) return;
      if (v === 'true') map[k] = true;
      else if (v === 'false') map[k] = false;
      else if (!Number.isNaN(Number(v)) && v !== '') map[k] = Number(v);
      else map[k] = v;
    });
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
        attributes: parseAttributes(attrText),
      });
      setTitle('');
      setPrice('');
      notifySuccess('Offering added cleanly.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add offering.');
    }
  }

  async function handleOfferingStatus(offering, newStatus) {
    setError('');
    try {
      await api.put(`/offerings/${offering.id}`, {
        status: newStatus,
        expectedVersion: offering.version,
      });
      notifySuccess(`Updated "${offering.title}" status to ${newStatus}.`);
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update offering status.');
    }
  }

  async function handleConfirmFresh(offeringId) {
    setError('');
    try {
      await api.patch(`/offerings/${offeringId}/confirm`);
      notifySuccess('Availability freshness confirmed.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm freshness.');
    }
  }

  async function handleDeleteOffering(offeringId) {
    setError('');
    try {
      await api.delete(`/offerings/${offeringId}`);
      notifySuccess('Offering deleted.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete offering.');
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
      notifySuccess('Weekly operating hours saved.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save operating hours.');
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
      notifySuccess('Photo uploaded cleanly.');
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
      notifySuccess('Photo deleted.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete photo.');
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
      notifySuccess('Update published to campus feed.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not publish update.');
    }
  }

  async function handleDeleteUpdate(updateId) {
    setError('');
    try {
      await api.delete(`/updates/${updateId}`);
      notifySuccess('Update removed.');
      loadStudioData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove update.');
    }
  }

  const tabs = [
    { id: 'offerings', label: `Offerings (${offerings.length})` },
    { id: 'hours', label: 'Operating Hours' },
    { id: 'photos', label: `Photos (${photos.length})` },
    { id: 'updates', label: `Updates (${updates.length})` },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Vendor Studio
          </span>
          <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
          <p className="text-xs text-gray-500">{business.address}</p>
        </div>
        <Link
          to={`/businesses/${business.id}`}
          className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition self-start"
        >
          View Public Listing →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {feedback}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TAB 1: OFFERINGS */}
      {activeTab === 'offerings' && (
        <div className="space-y-6">
          <form onSubmit={handleAddOffering} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Add New Offering</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={offeringType}
                onChange={(e) => setOfferingType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {OFFERING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Single AC Room"
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price (INR)"
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
              <input
                type="text"
                value={pricingUnit}
                onChange={(e) => setPricingUnit(e.target.value)}
                placeholder="PER_MONTH / PER_PLATE"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={attrText}
                onChange={(e) => setAttrText(e.target.value)}
                placeholder="Attributes (key=value, comma separated): ac=true, wifi=true, sharing=2"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                + Add Offering
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {offerings.map((o) => (
              <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{o.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${OFFERING_STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                      {o.status}
                    </span>
                    <span className="text-xs text-gray-400">v{o.version}</span>
                  </div>
                  <p className="text-sm font-bold text-indigo-700">
                    {formatPrice(o.price, o.pricingUnit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confirmed {formatTimeAgo(o.lastConfirmedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={o.status}
                    onChange={(e) => handleOfferingStatus(o, e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    {OFFERING_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleConfirmFresh(o.id)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Confirm Fresh
                  </button>
                  <button
                    onClick={() => handleDeleteOffering(o.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HOURS */}
      {activeTab === 'hours' && (
        <form onSubmit={handleSaveHours} className="space-y-3">
          {schedule.map((entry, idx) => (
            <div key={entry.dayOfWeek} className="flex flex-wrap items-center justify-between gap-3 p-3 border border-gray-200 rounded-xl">
              <span className="w-28 font-medium text-sm text-gray-800">{DAY_NAMES[entry.dayOfWeek]}</span>

              <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={entry.isClosed}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[idx] = { ...entry, isClosed: e.target.checked };
                    setSchedule(next);
                  }}
                />
                Closed
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
                    className="px-2.5 py-1 border border-gray-300 rounded-lg"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={entry.closesAt}
                    onChange={(e) => {
                      const next = [...schedule];
                      next[idx] = { ...entry, closesAt: e.target.value };
                      setSchedule(next);
                    }}
                    className="px-2.5 py-1 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            Save Weekly Schedule
          </button>
        </form>
      )}

      {/* TAB 3: PHOTOS */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <form onSubmit={handleUploadPhoto} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
              placeholder="Optional caption"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full"
            />
            <button
              type="submit"
              disabled={uploading || !photoFile}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <img src={p.publicUrl} alt={p.caption || business.name} className="w-full h-40 object-cover bg-gray-100" />
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 truncate">{p.caption || p.storageKey}</span>
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: UPDATES */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          <form onSubmit={handlePublishUpdate} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Broadcast Live Update</h3>
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
                <option value="">No linked offering</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={expiresHours}
                onChange={(e) => setExpiresHours(e.target.value)}
                placeholder="Expires in hours (0 = never)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              />
            </div>
            <input
              type="text"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="Headline (e.g. Today's Lunch: Shahi Paneer & Dal Makhani)"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            />
            <textarea
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              placeholder="Update details..."
              rows={2}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
            >
              Publish Update
            </button>
          </form>

          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="p-4 border border-gray-200 rounded-xl flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-700">
                    {UPDATE_TYPE_LABELS[u.updateType] || u.updateType}
                  </span>
                  <h4 className="font-semibold text-gray-900">{u.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{u.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteUpdate(u.id)}
                  className="text-xs text-red-600 font-semibold hover:underline cursor-pointer shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
