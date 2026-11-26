import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar — role-aware navigation bar with distinct visual identity per role.
 *   Student → Discover, Feed, My Saved Places (Indigo/Blue)
 *   Vendor  → Discover, Feed, Manage My Shop (Emerald green highlight)
 *   Admin   → Discover, Feed, Admin Panel (Red)
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const vendorLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
    }`;

  const roleBadge = {
    STUDENT: 'bg-blue-100 text-blue-700',
    VENDOR: 'bg-emerald-100 text-emerald-800',
    ADMIN: 'bg-red-100 text-red-700',
  };

  const roleLabel = {
    STUDENT: '🎓 Student',
    VENDOR: '🏪 Shop Owner',
    ADMIN: '🛡️ Admin',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm ${
              user?.role === 'VENDOR' ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}
          >
            NB
          </span>
          <div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">NearBuzz</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
              Campus Radar
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={linkClass}>
            🔍 Discover
          </NavLink>
          <NavLink to="/feed" className={linkClass}>
            📢 Updates
          </NavLink>

          {user?.role === 'VENDOR' && (
            <NavLink to="/vendor" className={vendorLinkClass}>
              🏪 My Shop
            </NavLink>
          )}
          {user?.role === 'STUDENT' && (
            <NavLink to="/dashboard" className={linkClass}>
              🎓 My Places
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={linkClass}>
              🛡️ Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="font-semibold text-gray-800">{user.name}</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${roleBadge[user.role] || 'bg-gray-100'}`}>
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition px-2.5 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
