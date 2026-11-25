export const CATEGORIES = [
  { value: '', label: 'All Services', short: 'All' },
  { value: 'HOSTEL_PG', label: 'Hostels & PGs', short: 'Hostel / PG' },
  { value: 'MESS_TIFFIN', label: 'Mess & Tiffin', short: 'Mess / Tiffin' },
  { value: 'PRINTING', label: 'Printing & Xerox', short: 'Printing' },
  { value: 'BOOKS_STATIONERY', label: 'Books & Stationery', short: 'Books' },
  { value: 'KIRANA', label: 'Kirana & Essentials', short: 'Kirana' },
  { value: 'LIBRARY', label: 'Study Libraries', short: 'Library' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.filter((c) => c.value).map((c) => [c.value, c.label])
);

export const CATEGORY_BADGE_COLORS = {
  HOSTEL_PG: 'bg-indigo-100 text-indigo-700',
  MESS_TIFFIN: 'bg-amber-100 text-amber-800',
  PRINTING: 'bg-cyan-100 text-cyan-800',
  BOOKS_STATIONERY: 'bg-violet-100 text-violet-700',
  KIRANA: 'bg-emerald-100 text-emerald-800',
  LIBRARY: 'bg-rose-100 text-rose-700',
};

export const OFFERING_STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-amber-100 text-amber-800',
  SOLD_OUT: 'bg-red-100 text-red-700',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  UNAVAILABLE: 'bg-gray-200 text-gray-700',
  UNCONFIRMED: 'bg-orange-100 text-orange-700',
};

export const UPDATE_TYPE_LABELS = {
  MENU_UPDATE: 'Menu Update',
  HOURS_CHANGE: 'Hours Change',
  STOCK_ARRIVAL: 'Stock Arrival',
  PRICE_CHANGE: 'Price Update',
  ANNOUNCEMENT: 'Announcement',
};

export const DEFAULT_CAMPUS_COORDS = {
  lat: 28.475,
  lng: 77.495,
  label: 'Knowledge Park II, Greater Noida',
};

export function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatPrice(price, unit) {
  const num = Number(price || 0).toLocaleString('en-IN');
  if (!unit) return `₹${num}`;
  const cleanUnit = unit.replace(/^PER_/, '/ ').replaceAll('_', ' ').toLowerCase();
  return `₹${num} ${cleanUnit}`;
}
