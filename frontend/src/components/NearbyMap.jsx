import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORY_LABELS, formatDistance, getGoogleMapsDirectionsUrl } from '../utils/constants';

const CATEGORY_EMOJI = {
  HOSTEL_PG: '🏠',
  MESS_TIFFIN: '🍱',
  PRINTING: '🖨️',
  BOOKS_STATIONERY: '📚',
  KIRANA: '🛒',
  LIBRARY: '📖',
};

/**
 * Builds a DOM popup safely using textContent (no raw HTML injection from business fields).
 */
function buildPopupElement(biz, onOpenBusiness) {
  const wrap = document.createElement('div');
  wrap.className = 'min-w-[190px] space-y-1.5 font-sans';

  const cat = document.createElement('div');
  cat.className = 'text-[11px] font-semibold text-indigo-700';
  cat.textContent = CATEGORY_LABELS[biz.category] || biz.category || '';
  wrap.appendChild(cat);

  const title = document.createElement('div');
  title.className = 'text-sm font-bold text-gray-900';
  title.textContent = biz.name || 'Shop';
  wrap.appendChild(title);

  if (biz.distanceMeters != null) {
    const dist = document.createElement('div');
    dist.className = 'text-xs text-gray-600';
    dist.textContent = formatDistance(biz.distanceMeters);
    wrap.appendChild(dist);
  }

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-2 pt-1.5';

  const viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer';
  viewBtn.textContent = 'View Prices →';
  viewBtn.addEventListener('click', () => onOpenBusiness(biz.id));
  actions.appendChild(viewBtn);

  const dirUrl = getGoogleMapsDirectionsUrl(biz.latitude, biz.longitude);
  if (dirUrl) {
    const dirLink = document.createElement('a');
    dirLink.href = dirUrl;
    dirLink.target = '_blank';
    dirLink.rel = 'noreferrer';
    dirLink.className = 'px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold';
    dirLink.textContent = '📍 Directions';
    actions.appendChild(dirLink);
  }

  wrap.appendChild(actions);
  return wrap;
}

/**
 * NearbyMap — Interactive OpenStreetMap view showing student's reference point and shop pins.
 */
export default function NearbyMap({ centerCoords, businesses, radiusMeters }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [28.475, 77.495],
      zoom: 15,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerGroupRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const boundsPoints = [[centerCoords.lat, centerCoords.lng]];

    // Draw radius circle when browsing nearby
    if (radiusMeters) {
      L.circle([centerCoords.lat, centerCoords.lng], {
        radius: radiusMeters,
        color: '#4f46e5',
        fillColor: '#6366f1',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '4 4',
      }).addTo(layer);
    }

    // Student / campus center marker
    const userIcon = L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([centerCoords.lat, centerCoords.lng], { icon: userIcon })
      .bindPopup(centerCoords.label || 'Your Location')
      .addTo(layer);

    // Shop pins
    businesses.forEach((biz) => {
      if (biz.latitude == null || biz.longitude == null) return;
      boundsPoints.push([biz.latitude, biz.longitude]);

      const emoji = CATEGORY_EMOJI[biz.category] || '📍';
      const shopIcon = L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#ffffff;border:2px solid #4338ca;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:16px;">${emoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const popupNode = buildPopupElement(biz, (id) => navigate(`/businesses/${id}`));
      L.marker([biz.latitude, biz.longitude], { icon: shopIcon })
        .bindPopup(popupNode)
        .addTo(layer);
    });

    if (boundsPoints.length > 1) {
      map.fitBounds(boundsPoints, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView([centerCoords.lat, centerCoords.lng], 15);
    }
  }, [centerCoords, businesses, radiusMeters, navigate]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-[420px] sm:h-[500px] rounded-2xl border border-gray-200 shadow-sm z-0"
      />
      <p className="text-xs text-gray-500 text-center">
        Tap any pin on the map to see prices or open turn-by-turn directions in Google Maps.
      </p>
    </div>
  );
}
