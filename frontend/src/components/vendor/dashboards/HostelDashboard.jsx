import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import {
  LocationPickerMap,
  NoticeComposer,
  StudentPreviewModal,
  VoiceMicButton,
} from '../index';

const ROOM_TYPES = ['Single Room', 'Double Sharing', 'Triple Sharing', 'Dormitory'];
const COOLING_TYPES = ['AC', 'Cooler', 'Non-AC'];

const ALL_FACILITIES = [
  'High-Speed Wi-Fi',
  'Attached Bathroom',
  'Food Included',
  'RO Drinking Water',
  'Washing Machine',
  'Power Backup',
  'CCTV Security',
  'Two-Wheeler Parking',
  'Study Table & Chair',
  'Hot Water Geyser',
];

const HOSTEL_NOTICE_TEMPLATES = [
  '2 AC rooms just became vacant!',
  'Special discount for 1st-year students',
  'Free room visit available today 10 AM – 7 PM',
];

const DEFAULT_RULES = {
  forWhom: 'Boys Only',
  depositType: '1 Month Rent',
  depositFixedAmount: '5000',
  electricity: 'Separate (Per Unit)',
  curfewType: '10:00 PM',
  curfewCustom: '10:30 PM',
  facilities: ['High-Speed Wi-Fi', 'RO Drinking Water'],
};

function parseRoomAttributes(offering) {
  const attrs = offering.attributes || {};
  const roomType = attrs.roomType || offering.title || 'Room';
  const cooling = attrs.cooling || (attrs.ac ? 'AC' : 'Non-AC');
  const vacantBeds =
    attrs.vacantBeds != null
      ? Number(attrs.vacantBeds)
      : offering.status === 'AVAILABLE'
      ? 1
      : 0;
  const note = attrs.note || attrs.details || '';
  const photos = Array.isArray(attrs.photos) ? attrs.photos : [];
  return { roomType, cooling, vacantBeds, note, photos };
}

function hydrateRulesFromMetadata(metadata) {
  const saved = metadata?.hostelRules || {};
  // Also map initial step-2 onboarding highlights if hostelRules wasn't saved yet
  let fallbackForWhom = DEFAULT_RULES.forWhom;
  if (metadata?.who) {
    if (String(metadata.who).toLowerCase().includes('girl')) fallbackForWhom = 'Girls Only';
    else if (String(metadata.who).toLowerCase().includes('co-ed')) fallbackForWhom = 'Co-ed';
    else fallbackForWhom = 'Boys Only';
  }
  return {
    forWhom: saved.forWhom || fallbackForWhom,
    depositType: saved.depositType || DEFAULT_RULES.depositType,
    depositFixedAmount: saved.depositFixedAmount || DEFAULT_RULES.depositFixedAmount,
    electricity: saved.electricity || DEFAULT_RULES.electricity,
    curfewType: saved.curfewType || DEFAULT_RULES.curfewType,
    curfewCustom: saved.curfewCustom || DEFAULT_RULES.curfewCustom,
    facilities: Array.isArray(saved.facilities) ? saved.facilities : DEFAULT_RULES.facilities,
  };
}

/**
 * HostelDashboard — Complete Hostels & PGs Vendor Portal (1/6) matching
 * ui-reference/nearbuzz_hostels_pgs_vendor_portal_1_6.html and backed by Spring Boot + PostgreSQL.
 */
export default function HostelDashboard({
  business,
  onBusinessUpdated,
  previewOpen,
  onClosePreview,
}) {
  const [activeTab, setActiveTab] = useState('rooms');
  const [addRoomExpanded, setAddRoomExpanded] = useState(true);
  const [toast, setToast] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [buildingPhotos, setBuildingPhotos] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Room Draft
  const [draftType, setDraftType] = useState('Double Sharing');
  const [draftCooling, setDraftCooling] = useState('AC');
  const [draftRent, setDraftRent] = useState('');
  const [draftVacantBeds, setDraftVacantBeds] = useState(1);
  const [draftNote, setDraftNote] = useState('');
  const [draftPhotos, setDraftPhotos] = useState([]); // { file, previewUrl }
  const draftPhotosRef = useRef([]);
  const [addingRoom, setAddingRoom] = useState(false);

  // Rules & Facilities persisted in business.metadata.hostelRules
  const [rules, setRules] = useState(() => hydrateRulesFromMetadata(business.metadata));
  const [savingRules, setSavingRules] = useState(false);

  // Building photo upload state
  const [uploadingBuilding, setUploadingBuilding] = useState(false);

  // Shop Info & GPS state
  const [hostelName, setHostelName] = useState(business.name || '');
  const [hostelPhone, setHostelPhone] = useState(business.phone || business.whatsapp || '');
  const [hostelAddress, setHostelAddress] = useState(business.address || '');
  const [hostelLat, setHostelLat] = useState(String(business.latitude ?? 22.6847));
  const [hostelLng, setHostelLng] = useState(String(business.longitude ?? 75.8639));
  const [locationSource, setLocationSource] = useState('map');
  const [savingInfo, setSavingInfo] = useState(false);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3000);
  }

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, phoRes, updRes] = await Promise.all([
        api.get(`/businesses/${business.id}/offerings`),
        api.get(`/businesses/${business.id}/photos`),
        api.get(`/businesses/${business.id}/updates`),
      ]);
      setRooms(offRes.data);
      // Exclude room-attached uploads so building gallery remains distinct
      setBuildingPhotos(phoRes.data.filter((p) => !(p.caption || '').startsWith('Room:')));
      setNotices(updRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load hostel data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [business.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    draftPhotosRef.current = draftPhotos;
  }, [draftPhotos]);

  // Revoke remaining draft object URLs only on unmount
  useEffect(() => {
    return () => {
      draftPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  async function uploadSinglePhoto(file, caption) {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    const res = await api.post(`/businesses/${business.id}/photos/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { id: res.data.id, url: res.data.publicUrl };
  }

  function handleDraftPhotoFiles(e) {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - draftPhotos.length;
    const picked = files.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setDraftPhotos((prev) => [...prev, ...picked]);
    e.target.value = '';
  }

  function removeDraftPhoto(idx) {
    setDraftPhotos((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleAddRoom() {
    const rentNum = Number(draftRent);
    if (Number.isNaN(rentNum) || rentNum <= 0) {
      showToast('Please enter a valid Monthly Rent in ₹', 'error');
      return;
    }

    setAddingRoom(true);
    try {
      const uploadedPhotos = [];
      for (const item of draftPhotos) {
        const uploaded = await uploadSinglePhoto(item.file, `Room: ${draftType} (${draftCooling})`);
        uploadedPhotos.push(uploaded);
      }

      const beds = Math.max(0, Number(draftVacantBeds) || 0);
      await api.post(`/businesses/${business.id}/offerings`, {
        offeringType: 'HOSTEL_ROOM',
        title: `${draftType} (${draftCooling})`,
        price: rentNum,
        pricingUnit: 'PER_MONTH',
        status: beds > 0 ? 'AVAILABLE' : 'OCCUPIED',
        attributes: {
          roomType: draftType,
          cooling: draftCooling,
          ac: draftCooling === 'AC',
          vacantBeds: beds,
          note: draftNote.trim(),
          photos: uploadedPhotos,
        },
      });

      draftPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setDraftRent('');
      setDraftNote('');
      setDraftVacantBeds(1);
      setDraftPhotos([]);
      showToast('New room added to your hostel!');
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add room.', 'error');
    } finally {
      setAddingRoom(false);
    }
  }

  async function persistRoomUpdate(offering, nextAttributes, nextStatus, toastMsg) {
    try {
      await api.put(`/offerings/${offering.id}`, {
        status: nextStatus ?? offering.status,
        attributes: nextAttributes,
        expectedVersion: offering.version,
      });
      if (toastMsg) showToast(toastMsg);
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update room.', 'error');
    }
  }

  async function handleAdjustBeds(offering, delta) {
    const parsed = parseRoomAttributes(offering);
    const nextBeds = Math.max(0, parsed.vacantBeds + delta);
    const nextStatus = nextBeds > 0 ? 'AVAILABLE' : 'OCCUPIED';
    const nextAttrs = { ...(offering.attributes || {}), vacantBeds: nextBeds };
    await persistRoomUpdate(offering, nextAttrs, nextStatus, null);
  }

  async function handleDuplicateRoom(offering) {
    const parsed = parseRoomAttributes(offering);
    try {
      await api.post(`/businesses/${business.id}/offerings`, {
        offeringType: 'HOSTEL_ROOM',
        title: offering.title,
        price: offering.price,
        pricingUnit: 'PER_MONTH',
        status: parsed.vacantBeds > 0 ? 'AVAILABLE' : 'OCCUPIED',
        attributes: { ...(offering.attributes || {}) },
      });
      showToast(`Copied "${parsed.roomType}" — edit rent or beds anytime!`);
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not copy room.', 'error');
    }
  }

  async function handleDeleteRoom(offeringId) {
    try {
      await api.delete(`/offerings/${offeringId}`);
      showToast('Room removed from your list.', 'info');
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete room.', 'error');
    }
  }

  async function handleAddPhotoToRoom(offering, e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseRoomAttributes(offering);
    if (parsed.photos.length >= 3) return;

    try {
      const uploaded = await uploadSinglePhoto(file, `Room: ${parsed.roomType} (${parsed.cooling})`);
      const nextPhotos = [...parsed.photos, uploaded];
      const nextAttrs = { ...(offering.attributes || {}), photos: nextPhotos };
      await persistRoomUpdate(offering, nextAttrs, null, 'Room photo uploaded!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Photo upload failed.', 'error');
    }
  }

  async function handleDeleteRoomPhoto(offering, photoId) {
    const parsed = parseRoomAttributes(offering);
    const nextPhotos = parsed.photos.filter((p) => p.id !== photoId);
    const nextAttrs = { ...(offering.attributes || {}), photos: nextPhotos };
    await persistRoomUpdate(offering, nextAttrs, null, 'Room photo removed.');
    if (photoId) {
      api.delete(`/businesses/${business.id}/photos/${photoId}`).catch(() => {});
    }
  }

  async function handleSaveRules() {
    setSavingRules(true);
    try {
      const res = await api.patch('/businesses/my/metadata', {
        metadata: { hostelRules: rules },
      });
      if (onBusinessUpdated) onBusinessUpdated(res.data);
      showToast('Rules & Facilities saved and updated for students!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save rules.', 'error');
    } finally {
      setSavingRules(false);
    }
  }

  async function handleUploadBuildingPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setUploadingBuilding(true);
    try {
      for (const file of files) {
        const label = file.name.replace(/\.[^/.]+$/, '').slice(0, 40) || 'Hostel Photo';
        await uploadSinglePhoto(file, label);
      }
      showToast('Building photo uploaded!');
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setUploadingBuilding(false);
    }
  }

  async function handleDeleteBuildingPhoto(photoId) {
    try {
      await api.delete(`/businesses/${business.id}/photos/${photoId}`);
      showToast('Building photo removed.', 'info');
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete photo.', 'error');
    }
  }

  async function handleSaveShopInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await api.put('/businesses/my', {
        name: hostelName,
        category: business.category,
        businessType: 'hostel',
        description: business.description || '',
        address: hostelAddress,
        latitude: Number(hostelLat),
        longitude: Number(hostelLng),
        phone: hostelPhone || undefined,
        whatsapp: hostelPhone || undefined,
        metadata: business.metadata || {},
      });
      if (onBusinessUpdated) onBusinessUpdated(res.data);
      showToast('Hostel Info & GPS Pin saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save hostel info.', 'error');
    } finally {
      setSavingInfo(false);
    }
  }

  const totalVacantBeds = rooms.reduce((sum, r) => sum + parseRoomAttributes(r).vacantBeds, 0);

  const tabs = [
    { id: 'rooms', icon: '🛏️', label: 'Rooms & Rent', count: rooms.length },
    { id: 'rules', icon: '📋', label: 'Rules & Facilities', count: null },
    { id: 'media', icon: '📸', label: 'Photos & Notice', count: notices.length },
    { id: 'info', icon: '📍', label: 'Shop Info & GPS', count: null },
  ];

  const curfewDisplay = rules.curfewType === 'Custom' ? rules.curfewCustom : rules.curfewType;
  const depositDisplay =
    rules.depositType === 'Fixed Amount'
      ? `₹${rules.depositFixedAmount} Deposit`
      : `${rules.depositType} Deposit`;

  return (
    <div className="space-y-6">
      {/* Summary Counters Strip */}
      <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-emerald-200 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              Active &amp; Visible to Students
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {rules.forWhom}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              🌙 Curfew: {curfewDisplay}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center min-w-[136px]">
              <div className="text-2xl font-extrabold text-[#0F172A]">{rooms.length}</div>
              <div className="text-xs font-bold text-slate-600 mt-0.5">Room Types Listed</div>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-center min-w-[146px] ${
                totalVacantBeds > 0
                  ? 'bg-[#ECFDF5] border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div
                className={`text-2xl font-extrabold ${
                  totalVacantBeds > 0 ? 'text-[#047857]' : 'text-red-700'
                }`}
              >
                {totalVacantBeds}
              </div>
              <div
                className={`text-xs font-bold mt-0.5 ${
                  totalVacantBeds > 0 ? 'text-[#047857]' : 'text-red-700'
                }`}
              >
                Vacant Beds Right Now
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Large Touch-Friendly Tabs */}
      <nav
        className="bg-white rounded-2xl border border-emerald-100 shadow-xs p-2 overflow-x-auto no-scrollbar"
        aria-label="Hostel dashboard sections"
      >
        <div className="flex items-center gap-2 min-w-max sm:min-w-0 sm:grid sm:grid-cols-4">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[52px] px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-[#ECFDF5] hover:text-[#047857]'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
                {t.count !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* TAB 1: ROOMS & RENT */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Expandable Add a New Room Type Card */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setAddRoomExpanded((prev) => !prev)}
              className="w-full px-5 sm:px-6 py-4 bg-[#ECFDF5]/80 hover:bg-[#ECFDF5] flex items-center justify-between gap-3 text-left cursor-pointer border-b border-emerald-100"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <span>➕</span> Add a New Room Type
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Tap room sharing, cooling, enter monthly rent &amp; add 1–3 room photos
                </p>
              </div>
              <span className="min-h-[40px] px-3.5 rounded-xl bg-white border border-emerald-200 text-[#047857] font-bold text-sm flex items-center shrink-0">
                {addRoomExpanded ? 'Hide ▲' : 'Open ▼'}
              </span>
            </button>

            {addRoomExpanded && (
              <div className="p-5 sm:p-6 space-y-6">
                {/* 1. Room Type Pills */}
                <div className="space-y-2.5">
                  <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                    1. Room Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {ROOM_TYPES.map((rt) => {
                      const active = draftType === rt;
                      return (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => setDraftType(rt)}
                          className={`min-h-[50px] px-3 py-2.5 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                            active
                              ? 'bg-[#059669] border-[#059669] text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-[#ECFDF5]/60'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {rt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Cooling Pills */}
                <div className="space-y-2.5">
                  <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                    2. Cooling
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 sm:max-w-md">
                    {COOLING_TYPES.map((ct) => {
                      const active = draftCooling === ct;
                      return (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => setDraftCooling(ct)}
                          className={`min-h-[50px] px-3 py-2.5 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                            active
                              ? 'bg-[#059669] border-[#059669] text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-[#ECFDF5]/60'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {ct}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3 & 4. Monthly Rent & Vacant Beds Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                      3. Monthly Rent (₹)
                    </label>
                    <div className="flex items-center">
                      <span className="min-h-[54px] px-4 flex items-center rounded-l-xl bg-slate-100 border-2 border-r-0 border-slate-200 font-extrabold text-lg text-slate-700">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={draftRent}
                        onChange={(e) => setDraftRent(e.target.value)}
                        placeholder="e.g. 7500"
                        className="w-full min-h-[54px] px-4 py-3 rounded-r-xl bg-white border-2 border-slate-200 text-lg font-extrabold text-[#0F172A] focus:outline-none focus:border-[#059669]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                      4. Vacant Beds Right Now
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDraftVacantBeds((b) => Math.max(0, b - 1))}
                        aria-label="Decrease vacant beds"
                        className="w-14 h-[54px] rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-2xl font-extrabold text-slate-800 cursor-pointer"
                      >
                        −
                      </button>
                      <div className="flex-1 h-[54px] rounded-xl bg-[#ECFDF5] border-2 border-emerald-200 flex items-center justify-center text-2xl font-extrabold text-[#047857]">
                        {draftVacantBeds}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftVacantBeds((b) => b + 1)}
                        aria-label="Increase vacant beds"
                        className="w-14 h-[54px] rounded-xl bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 text-2xl font-extrabold text-[#047857] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Extra Note with Voice-to-Text Mic */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                    5. Extra Note (Optional)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="e.g. Attached bathroom, balcony, study table"
                      className="flex-1 min-h-[52px] px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-sm sm:text-base font-medium text-[#0F172A] focus:outline-none focus:border-[#059669]"
                    />
                    <VoiceMicButton
                      compact
                      ariaLabel="Voice to text for room note"
                      onTranscript={(spoken) => {
                        setDraftNote((prev) => (prev.trim() ? `${prev.trim()}, ${spoken}` : spoken));
                        showToast('Voice note added!');
                      }}
                      onError={(msg) => showToast(msg, 'info')}
                    />
                  </div>
                </div>

                {/* 6. Per-Room Photos (1 to 3 photos) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
                      6. Room Photos (1 to 3 photos)
                    </label>
                    <span className="text-xs font-bold text-slate-500">
                      {draftPhotos.length}/3 added
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-[#ECFDF5]/40 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {draftPhotos.map((p, idx) => (
                        <div
                          key={p.previewUrl}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-200 bg-white shadow-2xs"
                        >
                          <img
                            src={p.previewUrl}
                            alt="Room preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftPhoto(idx)}
                            aria-label="Remove room photo"
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-extrabold flex items-center justify-center shadow cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {draftPhotos.length < 3 && (
                        <label className="min-h-[96px] px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-200 text-[#047857] font-bold text-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition">
                          <span className="text-2xl">📷</span>
                          <span>+ Select Room Photos</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleDraftPhotoFiles}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Upload real photos of this room (bed, window, washroom) so students trust your listing.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={addingRoom}
                  onClick={handleAddRoom}
                  className="w-full sm:w-auto min-h-[54px] px-8 py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {addingRoom ? 'Saving Room & Photos...' : '+ Add Room'}
                </button>
              </div>
            )}
          </div>

          {/* Listed Rooms Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                Your Listed Rooms ({rooms.length})
              </h2>
              <span className="text-xs sm:text-sm font-medium text-slate-500">
                Use − / + anytime to update vacant beds live
              </span>
            </div>

            {loading ? (
              <div className="h-36 rounded-2xl bg-white border border-emerald-100 animate-pulse" />
            ) : rooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-emerald-300 p-10 text-center">
                <p className="text-3xl mb-2">🛏️</p>
                <p className="font-bold text-slate-800">No rooms listed yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Add your first room above to show up to nearby students.
                </p>
              </div>
            ) : (
              rooms.map((room) => {
                const parsed = parseRoomAttributes(room);
                const isFull = parsed.vacantBeds <= 0;
                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm p-5 space-y-4 ${
                      isFull ? 'border-slate-200' : 'border-emerald-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                            {parsed.roomType}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              parsed.cooling === 'AC'
                                ? 'bg-sky-100 text-sky-800'
                                : parsed.cooling === 'Cooler'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {parsed.cooling === 'AC'
                              ? '❄️ AC'
                              : parsed.cooling === 'Cooler'
                              ? '💨 Cooler'
                              : '🌀 Non-AC'}
                          </span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                              isFull
                                ? 'bg-red-100 text-red-700'
                                : 'bg-[#ECFDF5] text-[#047857] border border-emerald-200'
                            }`}
                          >
                            {isFull
                              ? 'Full'
                              : `${parsed.vacantBeds} ${
                                  parsed.vacantBeds === 1 ? 'Bed' : 'Beds'
                                } Vacant`}
                          </span>
                        </div>

                        <div className="text-xl sm:text-2xl font-extrabold text-[#047857]">
                          ₹{Number(room.price).toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-semibold text-slate-500">/ month</span>
                        </div>

                        {parsed.note && <p className="text-sm text-slate-600">{parsed.note}</p>}
                      </div>

                      {/* Stepper + Copy & Delete */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-slate-200 rounded-2xl p-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustBeds(room, -1)}
                            aria-label="Decrease vacant beds"
                            className="w-11 h-11 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xl font-extrabold text-slate-800 cursor-pointer"
                          >
                            −
                          </button>
                          <div className="px-2.5 text-center min-w-[76px]">
                            <div
                              className={`text-lg font-extrabold leading-none ${
                                isFull ? 'text-red-600' : 'text-[#047857]'
                              }`}
                            >
                              {parsed.vacantBeds}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                              Vacant Beds
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdjustBeds(room, 1)}
                            aria-label="Increase vacant beds"
                            className="w-11 h-11 rounded-xl bg-[#ECFDF5] hover:bg-emerald-200 border border-emerald-300 text-xl font-extrabold text-[#047857] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDuplicateRoom(room)}
                          className="min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#047857] text-slate-700 font-bold text-sm cursor-pointer transition"
                        >
                          📋 Copy
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          aria-label="Delete room"
                          className="min-h-[48px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm cursor-pointer transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Per-room Photo Strip (up to 3 photos) */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                      {parsed.photos.map((ph) => (
                        <div
                          key={ph.id || ph.url}
                          className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={ph.url}
                            alt={`${parsed.roomType} photo`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteRoomPhoto(room, ph.id)}
                            aria-label="Delete room photo"
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/75 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {parsed.photos.length < 3 ? (
                        <label className="h-16 px-3.5 rounded-xl bg-[#ECFDF5] hover:bg-emerald-100 border border-dashed border-emerald-400 text-[#047857] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition">
                          <span>📷</span>
                          <span>+ Add Photo</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleAddPhotoToRoom(room, e)}
                          />
                        </label>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Max 3 photos added
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RULES & FACILITIES */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-7 space-y-7">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
              Hostel Rules &amp; Facilities
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Just tap the buttons that match your hostel. Saved directly to your listing.
            </p>
          </div>

          <RuleOptionGroup
            label="1. For Whom"
            options={['Boys Only', 'Girls Only', 'Co-ed']}
            currentVal={rules.forWhom}
            onSelect={(val) => setRules((r) => ({ ...r, forWhom: val }))}
          />

          <div className="space-y-3">
            <RuleOptionGroup
              label="2. Security Deposit"
              options={['None', '1 Month Rent', '2 Months Rent', 'Fixed Amount']}
              currentVal={rules.depositType}
              onSelect={(val) => setRules((r) => ({ ...r, depositType: val }))}
            />
            {rules.depositType === 'Fixed Amount' && (
              <div className="sm:max-w-xs flex items-center pt-1">
                <span className="min-h-[50px] px-4 flex items-center rounded-l-xl bg-slate-100 border-2 border-r-0 border-slate-200 font-bold text-slate-700">
                  ₹
                </span>
                <input
                  type="number"
                  value={rules.depositFixedAmount}
                  onChange={(e) =>
                    setRules((r) => ({ ...r, depositFixedAmount: e.target.value }))
                  }
                  placeholder="e.g. 5000"
                  className="w-full min-h-[50px] px-4 py-2.5 rounded-r-xl bg-white border-2 border-slate-200 font-bold text-base focus:outline-none focus:border-[#059669]"
                />
              </div>
            )}
          </div>

          <RuleOptionGroup
            label="3. Electricity Bill"
            options={['Included in Rent', 'Separate (Per Unit)']}
            currentVal={rules.electricity}
            onSelect={(val) => setRules((r) => ({ ...r, electricity: val }))}
          />

          <div className="space-y-3">
            <RuleOptionGroup
              label="4. Gate Closing Time (Curfew)"
              options={['No Curfew', '10:00 PM', '11:00 PM', 'Custom']}
              currentVal={rules.curfewType}
              onSelect={(val) => setRules((r) => ({ ...r, curfewType: val }))}
            />
            {rules.curfewType === 'Custom' && (
              <input
                type="text"
                value={rules.curfewCustom}
                onChange={(e) => setRules((r) => ({ ...r, curfewCustom: e.target.value }))}
                placeholder="e.g. 9:30 PM"
                className="w-full sm:max-w-xs min-h-[50px] px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 font-bold text-base focus:outline-none focus:border-[#059669]"
              />
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-sm sm:text-base font-bold text-[#0F172A]">
              5. Tap Facilities Available in Your Hostel
            </label>
            <div className="flex flex-wrap gap-2.5">
              {ALL_FACILITIES.map((fac) => {
                const selected = rules.facilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() =>
                      setRules((r) => ({
                        ...r,
                        facilities: selected
                          ? r.facilities.filter((f) => f !== fac)
                          : [...r.facilities, fac],
                      }))
                    }
                    className={`min-h-[48px] px-4 py-2.5 rounded-full border-2 font-bold text-sm transition cursor-pointer flex items-center gap-2 ${
                      selected
                        ? 'bg-[#ECFDF5] border-[#059669] text-[#047857] shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-base leading-none">{selected ? '✓' : '+'}</span>
                    <span>{fac}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={savingRules}
              onClick={handleSaveRules}
              className="w-full sm:w-auto min-h-[54px] px-8 py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base shadow-sm cursor-pointer disabled:opacity-50"
            >
              {savingRules ? 'Saving...' : '✓ Save Rules & Facilities'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BUILDING PHOTOS & NOTICE */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                Building &amp; Common Area Photos
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Add clear photos of your front gate, hallway, and mess/dining area.
              </p>
            </div>

            <div className="border-2 border-dashed border-emerald-300 rounded-2xl bg-[#ECFDF5]/40 p-6 text-center space-y-3">
              <div className="text-3xl">🏢</div>
              <label className="min-h-[50px] px-6 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm sm:text-base shadow-sm cursor-pointer inline-flex items-center gap-2">
                <span>📷 {uploadingBuilding ? 'Uploading...' : 'Upload Building Photos'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploadingBuilding}
                  className="hidden"
                  onChange={handleUploadBuildingPhotos}
                />
              </label>
            </div>

            {buildingPhotos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildingPhotos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                  >
                    <img
                      src={p.publicUrl}
                      alt={p.caption || business.name}
                      className="w-full h-44 object-cover bg-emerald-50"
                    />
                    <div className="p-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {p.caption || 'Building Photo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBuildingPhoto(p.id)}
                        className="min-h-[38px] px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <NoticeComposer
            businessId={business.id}
            templates={HOSTEL_NOTICE_TEMPLATES}
            offerings={rooms}
            onUpdatesChanged={setNotices}
          />
        </div>
      )}

      {/* TAB 4: SHOP INFO & GPS */}
      {activeTab === 'info' && (
        <form
          onSubmit={handleSaveShopInfo}
          className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-7 space-y-6"
        >
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
              Hostel Details &amp; Map GPS Pin
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Keep your phone number and map pin accurate so students can walk straight to your gate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#0F172A]">Hostel / PG Name</label>
              <input
                type="text"
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                required
                className="w-full min-h-[52px] px-4 py-3 rounded-xl bg-white border-2 border-slate-200 font-bold text-base text-[#0F172A] focus:outline-none focus:border-[#059669]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#0F172A]">
                Owner Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                value={hostelPhone}
                onChange={(e) => setHostelPhone(e.target.value)}
                placeholder="+91 98261 44510"
                className="w-full min-h-[52px] px-4 py-3 rounded-xl bg-white border-2 border-slate-200 font-bold text-base text-[#0F172A] focus:outline-none focus:border-[#059669]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0F172A]">
              Full Address &amp; Nearby Landmark
            </label>
            <input
              type="text"
              value={hostelAddress}
              onChange={(e) => setHostelAddress(e.target.value)}
              required
              className="w-full min-h-[52px] px-4 py-3 rounded-xl bg-white border-2 border-slate-200 font-bold text-base text-[#0F172A] focus:outline-none focus:border-[#059669]"
            />
          </div>

          <LocationPickerMap
            lat={hostelLat}
            lng={hostelLng}
            pinLabel="Hostel"
            locationConfirmed={locationSource}
            onConfirmSource={setLocationSource}
            onChange={(nextLat, nextLng) => {
              setHostelLat(nextLat);
              setHostelLng(nextLng);
            }}
          />

          <button
            type="submit"
            disabled={savingInfo}
            className="min-h-[50px] px-6 py-3 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm sm:text-base cursor-pointer disabled:opacity-50"
          >
            {savingInfo ? 'Saving...' : '✓ Save Shop Info & GPS'}
          </button>
        </form>
      )}

      {/* Live Student Preview Modal */}
      <StudentPreviewModal
        open={previewOpen}
        onClose={onClosePreview}
        business={{
          ...business,
          name: hostelName,
          address: hostelAddress,
        }}
        badges={[
          `👤 ${rules.forWhom}`,
          `🌙 Curfew: ${curfewDisplay}`,
          `⚡ Electricity: ${rules.electricity}`,
          `🔐 ${depositDisplay}`,
        ]}
        facilities={rules.facilities}
        activeNotice={notices[0] || null}
      >
        <div className="space-y-3">
          <h4 className="text-base font-extrabold text-slate-900 px-1">
            🛏️ Available Rooms &amp; Monthly Rent
          </h4>
          {rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 text-sm text-slate-500 text-center">
              No rooms listed yet. Add rooms in Tab 1 to preview them here.
            </div>
          ) : (
            rooms.map((room) => {
              const parsed = parseRoomAttributes(room);
              const isFull = parsed.vacantBeds <= 0;
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-indigo-100 shadow-xs p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-base">
                          {parsed.roomType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {parsed.cooling}
                        </span>
                      </div>
                      {parsed.note && <p className="text-xs text-slate-600 mt-1">{parsed.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-indigo-700">
                        ₹{Number(room.price).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500">per month</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isFull
                        ? '🔴 Full'
                        : `🟢 ${parsed.vacantBeds} ${
                            parsed.vacantBeds === 1 ? 'Bed' : 'Beds'
                          } Vacant`}
                    </span>
                    {parsed.photos.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {parsed.photos.map((p) => (
                          <img
                            key={p.id || p.url}
                            src={p.url}
                            alt="Room"
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </StudentPreviewModal>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[92%] max-w-md flex justify-center">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 ${
              toast.type === 'error'
                ? 'bg-red-700 text-white border-red-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-[#047857] text-white border-emerald-900'
            }`}
          >
            <span>{toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleOptionGroup({ label, options, currentVal, onSelect }) {
  return (
    <div className="space-y-2.5">
      <label className="block text-sm sm:text-base font-bold text-[#0F172A]">{label}</label>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const active = currentVal === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl border-2 font-bold text-sm sm:text-base transition cursor-pointer ${
                active
                  ? 'bg-[#059669] border-[#059669] text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-[#ECFDF5]/60'
              }`}
            >
              {active ? '✓ ' : ''}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
