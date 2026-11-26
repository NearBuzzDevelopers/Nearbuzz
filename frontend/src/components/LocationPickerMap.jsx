import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LocationPickerMap — lets a vendor set their shop's exact coordinates in 3 ways:
 *   1. Tap "Use My Current Location" (GPS)
 *   2. Search an area/street name or click/drag the pin directly on the OpenStreetMap
 *   3. Enter exact Latitude / Longitude values manually
 */
export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  locationConfirmed,
  onConfirmSource,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onConfirmSourceRef = useRef(onConfirmSource);

  useEffect(() => {
    onChangeRef.current = onChange;
    onConfirmSourceRef.current = onConfirmSource;
  }, [onChange, onConfirmSource]);

  const [detecting, setDetecting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showManualCoords, setShowManualCoords] = useState(false);

  const numericLat = Number(lat) || 22.6847;
  const numericLng = Number(lng) || 75.8639;

  // Initialize Leaflet map + draggable pin once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.6847, 75.8639],
      zoom: 16,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: '',
      html: '<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#059669;color:#fff;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-size:18px;">🏪</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([22.6847, 75.8639], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeRef.current(pos.lat.toFixed(6), pos.lng.toFixed(6));
      if (onConfirmSourceRef.current) onConfirmSourceRef.current('map');
    });

    map.on('click', (e) => {
      const nextLat = e.latlng.lat.toFixed(6);
      const nextLng = e.latlng.lng.toFixed(6);
      marker.setLatLng(e.latlng);
      onChangeRef.current(nextLat, nextLng);
      if (onConfirmSourceRef.current) onConfirmSourceRef.current('map');
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep map pin synchronized whenever lat/lng change (via GPS, search, or manual boxes)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (Number.isNaN(numericLat) || Number.isNaN(numericLng)) return;

    marker.setLatLng([numericLat, numericLng]);
    map.panTo([numericLat, numericLng]);
  }, [numericLat, numericLng]);

  function handleUseCurrentGps() {
    if (!navigator.geolocation) {
      setSearchError('GPS location is not supported on this device. Please mark your shop on the map.');
      return;
    }
    setDetecting(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
        if (onConfirmSource) onConfirmSource('gps');
        setDetecting(false);
      },
      () => {
        setSearchError('Could not read GPS permission. You can tap your area on the map instead.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSearchPlace() {
    const q = searchText.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      );
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const hit = data[0];
        const nextLat = Number(hit.lat).toFixed(6);
        const nextLng = Number(hit.lon).toFixed(6);
        onChange(nextLat, nextLng);
        if (onConfirmSource) onConfirmSource('map');
        if (mapRef.current) {
          mapRef.current.setView([Number(nextLat), Number(nextLng)], 16);
        }
      } else {
        setSearchError('Could not find that street or landmark. Try dragging the pin directly on the map.');
      }
    } catch {
      setSearchError('Area lookup failed. Please drag the pin or use GPS.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">Pin Your Exact Shop Location *</p>
          <p className="text-xs text-gray-600">
            {locationConfirmed === 'gps'
              ? '✓ Using your live phone GPS location'
              : locationConfirmed === 'map'
              ? '✓ Location pinned on map'
              : locationConfirmed === 'manual'
              ? '✓ Custom coordinates entered'
              : 'Tap "Use Current Location", search your street, or tap/drag the green 🏪 pin on the map.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentGps}
          disabled={detecting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 disabled:opacity-50"
        >
          {detecting ? 'Detecting GPS...' : '📍 Use Current Location'}
        </button>
      </div>

      {/* Area / Landmark Search inside Map */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchPlace();
            }
          }}
          placeholder="Jump map to street/area (e.g. Bholaram Ustad Marg, Indore)"
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={handleSearchPlace}
          disabled={searching || !searchText.trim()}
          className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          {searching ? 'Finding...' : 'Find on Map'}
        </button>
      </div>

      {searchError && <p className="text-xs text-red-600">{searchError}</p>}

      {/* Interactive Map */}
      <div
        ref={mapContainerRef}
        className="w-full h-56 sm:h-64 rounded-xl border border-emerald-300 z-0 overflow-hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-gray-600">
          Selected Pin: <strong>{numericLat.toFixed(5)}, {numericLng.toFixed(5)}</strong>
        </span>
        <button
          type="button"
          onClick={() => setShowManualCoords((prev) => !prev)}
          className="text-emerald-800 font-semibold underline cursor-pointer"
        >
          {showManualCoords ? 'Hide exact coordinates' : 'Enter exact Latitude / Longitude manually'}
        </button>
      </div>

      {showManualCoords && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => {
                onChange(e.target.value, lng);
                if (onConfirmSource) onConfirmSource('manual');
              }}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => {
                onChange(lat, e.target.value);
                if (onConfirmSource) onConfirmSource('manual');
              }}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
