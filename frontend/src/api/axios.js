import axios from 'axios';

/**
 * Storage keys for PWA session persistence across cross-origin API calls.
 * Security note: The JWT is only issued after Email OTP verification, is HMAC-signed
 * by the backend, and expires after 7 days. Every API call still verifies signature,
 * expiration, and account status on the server.
 */
const TOKEN_KEY = 'nearbuzz_jwt';
const USER_KEY = 'nearbuzz_user';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage quota / privacy mode errors; cookie fallback still works
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Axios instance configured for our Spring Boot backend.
 * Sends BOTH the HttpOnly cookie (withCredentials) AND the Bearer token header
 * so installed mobile PWAs remain signed in across app closes even when
 * third-party cookies are restricted.
 */
const apiRoot = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';

const api = axios.create({
  baseURL: `${apiRoot}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
