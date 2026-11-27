import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth, roleHomePath } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import { getBusinessType, vendorDashboardPath } from '../utils/constants';

/**
 * LoginPage — two-step passwordless email OTP login with unmistakable role selection.
 *
 * Step 1: Pick Student vs Shop Owner (Vendor) + enter email -> Send OTP
 * Step 2: Enter 6-digit code -> Verify -> land directly on Student or Vendor home
 */
export default function LoginPage() {
  const { sendOtp, verifyOtp, user } = useAuth();
  const { detectGps } = useLocationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from || null;

  const resolvePostLoginPath = useCallback(async (userData) => {
    if (redirectTarget) return redirectTarget;
    if (userData?.role === 'VENDOR') {
      try {
        const res = await api.get('/businesses/my');
        return vendorDashboardPath(getBusinessType(res.data));
      } catch {
        return '/vendor';
      }
    }
    return roleHomePath(userData?.role);
  }, [redirectTarget]);

  useEffect(() => {
    let active = true;
    if (user) {
      resolvePostLoginPath(user).then((target) => {
        if (active) navigate(target, { replace: true });
      });
    }
    return () => {
      active = false;
    };
  }, [user, navigate, resolvePostLoginPath]);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await sendOtp(email);
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    await requestCode();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await verifyOtp(email, otp, name || undefined, role);
      detectGps();
      const target = await resolvePostLoginPath(userData);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'That code did not match or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isVendor = role === 'VENDOR';

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 ${
        isVendor
          ? 'bg-gradient-to-br from-emerald-50 to-green-100'
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className={`text-4xl font-bold mb-1 ${isVendor ? 'text-emerald-700' : 'text-indigo-700'}`}>
              NearBuzz
            </h1>
          </Link>
          <p className="text-sm text-gray-600">
            {isVendor ? 'Shop Owner & Hostel Manager Portal' : 'Find hostels, mess & services near college'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Who are you signing in as?</h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose one option below, then enter your email.
              </p>

              {/* Big Clear Role Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                    role === 'STUDENT'
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">🎓</span>
                  <span className="block text-sm font-bold text-gray-900">Student</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Browse hostels, mess & shops
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('VENDOR')}
                  className={`p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                    role === 'VENDOR'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">🏪</span>
                  <span className="block text-sm font-bold text-gray-900">Shop Owner</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    List & update my business
                  </span>
                </button>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isVendor ? 'example@gmail.com' : 'you@gmail.com'}
                required
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-xl outline-none transition mb-4 ${
                  isVendor
                    ? 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                    : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />

              <button
                type="submit"
                disabled={loading || !email}
                className={`w-full text-white py-3.5 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer ${
                  isVendor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Sending 6-digit code...' : 'Send 6-Digit Code to Email →'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                Returning users automatically open their saved account.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Check Your Email</h2>
              <p className="text-sm text-gray-600 mb-5">
                We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                6-Digit Code from Email
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className={`w-full px-4 py-3.5 border border-gray-300 rounded-xl outline-none transition text-center text-2xl tracking-widest font-mono mb-4 ${
                  isVendor
                    ? 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                    : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-gray-400 font-normal">(only needed first time)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isVendor ? 'e.g. Sharma Ji / Hostel Owner' : 'e.g. Vinay Patel'}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition mb-5 ${
                  isVendor
                    ? 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                    : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full text-white py-3.5 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer ${
                  isVendor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Signing you in...' : 'Verify & Open App'}
              </button>

              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className={`font-medium cursor-pointer ${
                    isVendor ? 'text-emerald-700 hover:underline' : 'text-indigo-600 hover:underline'
                  }`}
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={requestCode}
                  className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && step === 2 && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          You stay signed in on this device for 7 days — no password to remember.
        </p>
      </div>
    </div>
  );
}
