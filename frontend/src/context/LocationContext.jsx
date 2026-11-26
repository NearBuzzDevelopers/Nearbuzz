import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { CAMPUS_PRESETS, DEFAULT_CAMPUS_COORDS } from '../utils/constants';

const LocationContext = createContext(null);

/**
 * LocationProvider — tracks the active user's GPS location across Student and Vendor views.
 * Automatically attempts GPS detection as soon as the user logs in, falling back cleanly
 * to the campus preset if permission is denied or unavailable.
 */
export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [coords, setCoords] = useState({
    lat: DEFAULT_CAMPUS_COORDS.lat,
    lng: DEFAULT_CAMPUS_COORDS.lng,
    label: DEFAULT_CAMPUS_COORDS.label,
    source: 'default', // 'default' | 'gps' | 'preset'
  });
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const attemptedForUserRef = useRef(null);

  const detectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS location is not supported by your browser.');
      return Promise.resolve(null);
    }
    setLocating(true);
    setGpsError('');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detected = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            label: 'Your Live GPS Location',
            source: 'gps',
          };
          setCoords(detected);
          setLocating(false);
          resolve(detected);
        },
        () => {
          setGpsError('Location permission denied or unavailable. Using campus preset.');
          setLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, []);

  // Automatically trigger GPS detection when a student or vendor logs in
  useEffect(() => {
    const userKey = user?.id || null;
    if (userKey && attemptedForUserRef.current !== userKey) {
      attemptedForUserRef.current = userKey;
      detectGps();
    } else if (!userKey) {
      attemptedForUserRef.current = null;
    }
  }, [user?.id, detectGps]);

  const selectPreset = useCallback((presetId) => {
    const found = CAMPUS_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setGpsError('');
    setCoords({
      lat: found.lat,
      lng: found.lng,
      label: found.label,
      source: 'preset',
    });
  }, []);

  const value = {
    coords,
    locating,
    gpsError,
    detectGps,
    selectPreset,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return ctx;
}
