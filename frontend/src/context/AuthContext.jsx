import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../api/axios';

/**
 * AuthContext — manages user login state across the React app and installed PWA.
 *
 * How session persistence works without weakening OTP security:
 *   1. Users MUST sign in via Email OTP to obtain a signed 7-day JWT.
 *   2. The token is stored in BOTH the server's HttpOnly cookie and localStorage
 *      (sent via Authorization: Bearer), because mobile PWAs frequently block or
 *      drop cross-domain cookies when the app closes.
 *   3. On app reopen, cached user info prevents flashing back to /login while
 *      GET /api/v1/auth/me validates the token against the server.
 *   4. Only an explicit 401/403 from the server or Sign Out clears the session;
 *      Render free-tier wake-up delays won't accidentally log the user out.
 */

const AuthContext = createContext(null);

const AUTH_CHECK_TIMEOUT_MS = 45000;
const RETRY_DELAY_MS = 3000;

export function roleHomePath(role) {
  if (role === 'VENDOR') return '/vendor';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
}

export function AuthProvider({ children }) {
  // Optimistically hydrate user when reopening PWA if we already hold a token/session
  const [user, setUser] = useState(() => (getStoredToken() ? getStoredUser() : null));
  const [loading, setLoading] = useState(() => !(getStoredToken() && getStoredUser()));

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me', { timeout: AUTH_CHECK_TIMEOUT_MS });
      const freshUser = response.data;
      setUser(freshUser);
      setStoredUser(freshUser);
    } catch (firstError) {
      const status = firstError.response?.status;
      if (status === 401 || status === 403) {
        clearStoredAuth();
        setUser(null);
      } else if (!firstError.response) {
        // Network/timeout (e.g., Render cold start) — retry once before giving up
        try {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          const retryRes = await api.get('/auth/me', { timeout: AUTH_CHECK_TIMEOUT_MS });
          setUser(retryRes.data);
          setStoredUser(retryRes.data);
        } catch (retryErr) {
          const retryStatus = retryErr.response?.status;
          if (retryStatus === 401 || retryStatus === 403) {
            clearStoredAuth();
            setUser(null);
          }
          // If still a network error and we have a stored token, keep cached user
          // until connectivity returns and the backend verifies or rejects it.
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function sendOtp(email) {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  }

  async function verifyOtp(email, otp, name, role) {
    const response = await api.post('/auth/verify-otp', { email, otp, name, role });
    const { token, ...userProfile } = response.data;
    if (token) {
      setStoredToken(token);
    }
    setStoredUser(userProfile);
    setUser(userProfile);
    return userProfile;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local state even if offline
    }
    clearStoredAuth();
    setUser(null);
  }

  const value = {
    user,
    loading,
    sendOtp,
    verifyOtp,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth state from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
