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

export const OFFERING_TYPES = [
  { value: 'HOSTEL_ROOM', label: 'Hostel / PG Room' },
  { value: 'MESS_MENU', label: 'Mess / Tiffin Plan' },
  { value: 'PRINT_SERVICE', label: 'Printing / Xerox Service' },
  { value: 'PRODUCT_STOCK', label: 'Books / Stationery / Kirana Stock' },
  { value: 'LIBRARY_SEAT', label: 'Library Seat / Cabin' },
];

export const OFFERING_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'SOLD_OUT',
  'OUT_OF_STOCK',
  'UNAVAILABLE',
  'UNCONFIRMED',
];

export const OFFERING_STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-amber-100 text-amber-800',
  SOLD_OUT: 'bg-red-100 text-red-700',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  UNAVAILABLE: 'bg-gray-200 text-gray-700',
  UNCONFIRMED: 'bg-orange-100 text-orange-700',
};

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const UPDATE_TYPE_LABELS = {
  MENU_UPDATE: 'Menu Update',
  HOURS_CHANGE: 'Hours Change',
  STOCK_ARRIVAL: 'Stock Arrival',
  PRICE_CHANGE: 'Price Update',
  ANNOUNCEMENT: 'Announcement',
};

export const CAMPUS_PRESETS = [
  {
    id: 'indore',
    lat: 22.6847,
    lng: 75.8639,
    label: 'Bholaram Ustad Marg, Indore',
  },
  {
    id: 'noida',
    lat: 28.475,
    lng: 77.495,
    label: 'Knowledge Park II, Greater Noida',
  },
];

export const DEFAULT_CAMPUS_COORDS = CAMPUS_PRESETS[0];

/**
 * Category-driven onboarding metadata for the 6 service types.
 * Allows vendors to fill only fields relevant to their business before setting location.
 */
export const VENDOR_CATEGORY_CONFIG = {
  HOSTEL_PG: {
    icon: '🏠',
    title: 'Hostel / PG',
    subtitle: 'Rooms, beds, Wi-Fi & student stays',
    namePlaceholder: 'e.g. Sai Krupa Boys Hostel',
    addressPlaceholder: 'e.g. 42 Bholaram Ustad Marg, Bhawarkuan, Indore',
    notePlaceholder: 'e.g. RO drinking water, laundry & 24x7 security',
    fields: [
      { key: 'who', label: 'Who can stay here?', type: 'select', options: ['Boys', 'Girls', 'Co-ed / Separate Wings'] },
      { key: 'meals', label: 'Are meals included?', type: 'select', options: ['Yes, 3 meals included', 'Yes, 2 meals included', 'Room only (no meals)'] },
      { key: 'ac', label: 'Room cooling options', type: 'select', options: ['Both AC & Non-AC', 'Non-AC only', 'AC only'] },
      { key: 'curfew', label: 'Gate timing / curfew note', type: 'text', placeholder: 'e.g. Main gate closes 10:30 PM' },
    ],
  },
  MESS_TIFFIN: {
    icon: '🍱',
    title: 'Mess & Tiffin',
    subtitle: 'Daily thali, monthly tiffin & meals',
    namePlaceholder: 'e.g. Maa Vaishno Pure Veg Mess',
    addressPlaceholder: 'e.g. Near 99 Shop, Bholaram Ustad Marg, Indore',
    notePlaceholder: 'e.g. Sunday special Paneer & Gulab Jamun',
    fields: [
      { key: 'diet', label: 'Food type', type: 'select', options: ['Pure Veg', 'Veg & Non-Veg'] },
      { key: 'delivery', label: 'Tiffin delivery to hostels?', type: 'select', options: ['Yes, free nearby delivery', 'Dine-in & Pickup only'] },
      { key: 'slots', label: 'Meals served', type: 'select', options: ['Breakfast, Lunch & Dinner', 'Lunch & Dinner', 'Lunch only'] },
      { key: 'trial', label: 'Trial meal available?', type: 'select', options: ['Yes, single plate trial available', 'Monthly pass only'] },
    ],
  },
  PRINTING: {
    icon: '🖨️',
    title: 'Printing & Xerox',
    subtitle: 'Notes printout, color & thesis binding',
    namePlaceholder: 'e.g. Campus Fast Print & Xerox',
    addressPlaceholder: 'e.g. Shop 6, Main Square, Bhawarkuan, Indore',
    notePlaceholder: 'e.g. WhatsApp your PDF before coming to skip queue',
    fields: [
      { key: 'color', label: 'Color laser printing?', type: 'select', options: ['Both B&W and Color', 'B&W only'] },
      { key: 'binding', label: 'Project / Thesis binding?', type: 'select', options: ['Spiral & Hardbound both', 'Spiral binding only', 'Printout / Xerox only'] },
      { key: 'bulk', label: 'Bulk discount for notes?', type: 'select', options: ['Yes, special student rate', 'Standard fixed rate'] },
    ],
  },
  BOOKS_STATIONERY: {
    icon: '📚',
    title: 'Books & Stationery',
    subtitle: 'Textbooks, rentals, drafters & pens',
    namePlaceholder: 'e.g. Agrawal Book Depot & Stationery',
    addressPlaceholder: 'e.g. Near Holkar Science Gate, Bhawarkuan, Indore',
    notePlaceholder: 'e.g. All RGPV & DAVV semester guides available',
    fields: [
      { key: 'rental', label: 'Second-hand / Semester book rent?', type: 'select', options: ['Yes, buyback & rental available', 'New books & stationery only'] },
      { key: 'streams', label: 'Courses covered', type: 'text', placeholder: 'e.g. B.Tech, BCA, Pharmacy, Competitive exams' },
      { key: 'instruments', label: 'Lab coats / calculators / drafters?', type: 'select', options: ['Yes, stocked', 'No, books only'] },
    ],
  },
  KIRANA: {
    icon: '🛒',
    title: 'Kirana & Essentials',
    subtitle: 'Groceries, snacks, water & daily needs',
    namePlaceholder: 'e.g. Apna Student Mart & Kirana',
    addressPlaceholder: 'e.g. Lane 3, Bholaram Ustad Marg, Indore',
    notePlaceholder: 'e.g. Cold drinks, Maggie, milk & UPI accepted',
    fields: [
      { key: 'delivery', label: 'Delivery to hostels?', type: 'select', options: ['Yes, nearby hostel delivery', 'Shop counter only'] },
      { key: 'water', label: 'RO Water jars / milk packets?', type: 'select', options: ['Yes, daily stock', 'Dry groceries & snacks only'] },
      { key: 'hours', label: 'Late-night availability', type: 'select', options: ['Open till 11 PM / Midnight', 'Regular daytime hours'] },
    ],
  },
  LIBRARY: {
    icon: '📖',
    title: 'Study Library',
    subtitle: 'Quiet reading hall, Wi-Fi & cabins',
    namePlaceholder: 'e.g. Sankalp AC Reading Library',
    addressPlaceholder: 'e.g. 2nd Floor, Bhawarkuan Main Road, Indore',
    notePlaceholder: 'e.g. Power socket at every desk & newspaper corner',
    fields: [
      { key: 'cooling', label: 'Cooling / Environment', type: 'select', options: ['Full AC Reading Hall', 'Non-AC Ventilated Hall', 'Both AC & Non-AC rooms'] },
      { key: 'timing', label: 'Open hours', type: 'select', options: ['Open 24x7', 'Morning 6 AM – 11 PM', 'Daytime Shifts'] },
      { key: 'wifi', label: 'High-speed Wi-Fi & Lockers?', type: 'select', options: ['Free Wi-Fi + Lockers', 'Free Wi-Fi only', 'Quiet seating only'] },
    ],
  },
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

export function getGoogleMapsDirectionsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function getOsmEmbedUrl(lat, lng, delta = 0.004) {
  if (lat == null || lng == null) return null;
  const minLng = (Number(lng) - delta).toFixed(6);
  const minLat = (Number(lat) - delta).toFixed(6);
  const maxLng = (Number(lng) + delta).toFixed(6);
  const maxLat = (Number(lat) + delta).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
}
