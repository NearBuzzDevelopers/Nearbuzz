import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  LocationPickerMap,
  WeeklyOpeningHoursEditor,
  NoticeComposer,
} from './vendor';
import {
  CATEGORIES,
  OFFERING_TYPES,
  OFFERING_STATUSES,
  OFFERING_STATUS_COLORS,
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

export default function VendorStudio({ business, onBusinessUpdated }) {
  const [activeTab, setActiveTab] = useState('offerings');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Edit Shop Details & GPS state
  const [shopName, setShopName] = useState(business.name || '');
  const [shopCategory, setShopCategory] = useState(business.category || 'HOSTEL_PG');
  const [shopAddress, setShopAddress] = useState(business.address || '');
  const [shopPhone, setShopPhone] = useState(business.phone || business.whatsapp || '');
  const [shopDesc, setShopDesc] = useState(business.description || '');
  const [shopLat, setShopLat] = useState(String(business.latitude ?? 22.6847));
  const [shopLng, setShopLng] = useState(String(business.longitude ?? 75.8639));
  const [locationSource, setLocationSource] = useState('map');
  const [savingShop, setSavingShop] = useState(false);

  const [offerings, setOfferings] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [updatesCount, setUpdatesCount] = useState(0);

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

  const loadStudioData = useCallback(async () => {
    try {
      const [offRes, phoRes, updRes] = await Promise.all([
        api.get(`/businesses/${business.id}/offerings`),
        api.get(`/businesses/${business.id}/photos`),
        api.get(`/businesses/${business.id}/updates`),
      ]);
      setOfferings(offRes.data);
      setPhotos(phoRes.data);
      setUpdatesCount(updRes.data.length);
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

  async function handleSaveShopInfo(e) {
    e.preventDefault();
    setSavingShop(true);
    setError('');
    try {
      const res = await api.put('/businesses/my', {
        name: shopName,
        category: shopCategory,
        description: shopDesc,
        address: shopAddress,
        latitude: Number(shopLat),
        longitude: Number(shopLng),
        phone: shopPhone || undefined,
        whatsapp: shopPhone || undefined,
      });
      if (onBusinessUpdated) onBusinessUpdated(res.data);
      notifySuccess('Shop details & GPS location saved!');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save shop details.');
    } finally {
      setSavingShop(false);
    }
  }

  const tabs = [
    { id: 'offerings', label: `🏷️ Items & Prices (${offerings.length})` },
    { id: 'hours', label: '⏰ Opening Hours' },
    { id: 'photos', label: `📸 Photos (${photos.length})` },
    { id: 'updates', label: `📢 Post Notice (${updatesCount})` },
    { id: 'info', label: '⚙️ Shop Info & GPS' },
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

      {/* TAB 2: SHARED WEEKLY OPENING HOURS EDITOR */}
      {activeTab === 'hours' && (
        <WeeklyOpeningHoursEditor businessId={business.id} />
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

      {/* TAB 4: SHARED NOTICE COMPOSER */}
      {activeTab === 'updates' && (
        <NoticeComposer
          businessId={business.id}
          offerings={offerings}
          onUpdatesChanged={(list) => setUpdatesCount(list.length)}
        />
      )}

      {/* TAB 5: SHOP INFO & GPS */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveShopInfo} className="space-y-4 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-gray-900">Edit Shop Details & Map Location</h3>
            <p className="text-xs text-gray-600">
              Make sure your GPS location matches your real shop so nearby students can find you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Shop Name *</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Address *</label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone / WhatsApp</label>
              <input
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <LocationPickerMap
            lat={shopLat}
            lng={shopLng}
            locationConfirmed={locationSource}
            onConfirmSource={setLocationSource}
            onChange={(nextLat, nextLng) => {
              setShopLat(nextLat);
              setShopLng(nextLng);
            }}
          />

          <button
            type="submit"
            disabled={savingShop}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            {savingShop ? 'Saving...' : 'Save Shop Details & Location'}
          </button>
        </form>
      )}
    </section>
  );
}
