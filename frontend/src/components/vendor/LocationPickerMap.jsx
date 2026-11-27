import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LocationPickerMap — Shared Emerald Green GPS & Map Pin Picker component.
 * Lets any of the 6 vendor dashboards pin their shop via:
 *   1. "Use My Current GPS Location" button
 *   2. Street/landmark search + click/drag pin on interactive OpenStreetMap
 *   3. Exact Latitude / Longitude inputs
 */
export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  locationConfirmed,
  onConfirmSource,
  pinLabel = 'Your Shop',
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
  const [statusMessage, setStatusMessage] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showManualCoords, setShowManualCoords] = useState(false);

  const numericLat = Number(lat) || 22.6847;
  const numericLng = Number(lng) || 75.8639;

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
      html: '<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:#059669;color:#fff;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-size:18px;">📍</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const marker = L.marker([22.6847, 75.8639], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeRef.current(pos.lat.toFixed(6), pos.lng.toFixed(6));
      if (onConfirmSourceRef.current) onConfirmSourceRef.current('map');
      setStatusMessage('Map pin moved!');
    });

    map.on('click', (e) => {
      const nextLat = e.latlng.lat.toFixed(6);
      const nextLng = e.latlng.lng.toFixed(6);
      marker.setLatLng(e.latlng);
      onChangeRef.current(nextLat, nextLng);
      if (onConfirmSourceRef.current) onConfirmSourceRef.current('map');
      setStatusMessage('Pin placed on map!');
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

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
      setSearchError('GPS location is not supported on this device. Please tap or drag the pin on the map.');
      return;
    }
    setDetecting(true);
    setSearchError('');
    setStatusMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
        if (onConfirmSource) onConfirmSource('gps');
        setStatusMessage('GPS location locked!');
        setDetecting(false);
      },
      () => {
        setSearchError('Could not read GPS permission. You can tap or drag the pin on the map instead.');
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
    setStatusMessage('');
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
        setStatusMessage('Found area on map — drag the pin to your exact shop.');
        if (mapRef.current) {
          mapRef.current.setView([Number(nextLat), Number(nextLng)], 16);
        }
      } else {
        setSearchError('Could not find that street or landmark. Drag the green pin directly on the map.');
      }
    } catch {
      setSearchError('Area lookup failed. Drag the pin or tap Use Current GPS.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden shadow-xs">
      {/* Header Action Bar */}
      <div className="p-4 bg-[#ECFDF5]/70 border-b border-emerald-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-base font-extrabold text-[#0F172A]">
              🎯 {pinLabel} Location &amp; GPS Pin
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {locationConfirmed === 'gps'
                ? '✓ Live phone GPS locked'
                : locationConfirmed === 'map'
                ? '✓ Custom pin placed on map'
                : locationConfirmed === 'manual'
                ? '✓ Exact coordinates entered'
                : 'Tap GPS, search your street, or drag the green pin onto your exact shop.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={detecting}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition shrink-0 disabled:opacity-50"
          >
            <span>🎯</span>
            <span>{detecting ? 'Detecting GPS...' : 'Use My Current Location'}</span>
          </button>
        </div>

        {/* Street / Landmark Search */}
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
            className="flex-1 min-h-[46px] px-3.5 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:border-[#059669]"
          />
          <button
            type="button"
            onClick={handleSearchPlace}
            disabled={searching || !searchText.trim()}
            className="min-h-[46px] px-4 py-2 bg-white border-2 border-emerald-200 text-[#047857] hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {searching ? 'Finding...' : 'Find on Map'}
          </button>
        </div>

        {statusMessage && <p className="text-xs font-bold text-[#047857]">✓ {statusMessage}</p>}
        {searchError && <p className="text-xs font-semibold text-red-600">{searchError}</p>}
      </div>

      {/* Interactive Leaflet Map */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 sm:h-72 z-0"
      />

      {/* Footer Coordinates + Manual Entry Toggle */}
      <div className="px-4 py-3 bg-slate-50 border-t border-emerald-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono font-bold text-[#047857]">
            {numericLat.toFixed(4)}° N, {numericLng.toFixed(4)}° E
          </span>
          <button
            type="button"
            onClick={() => setShowManualCoords((prev) => !prev)}
            className="text-[#047857] font-bold underline cursor-pointer"
          >
            {showManualCoords ? 'Hide exact coordinates' : 'Enter exact Latitude / Longitude manually'}
          </button>
        </div>

        {showManualCoords && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => {
                  onChange(e.target.value, lng);
                  if (onConfirmSource) onConfirmSource('manual');
                }}
                required
                className="w-full min-h-[44px] px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#059669]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => {
                  onChange(lat, e.target.value);
                  if (onConfirmSource) onConfirmSource('manual');
                }}
                required
                className="w-full min-h-[44px] px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#059669]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
