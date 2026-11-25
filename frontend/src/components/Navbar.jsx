import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
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
            Discover
          </NavLink>
          <NavLink to="/feed" className={linkClass}>
            Updates Feed
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="font-semibold text-gray-800">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition px-2.5 py-1.5 rounded-lg hover:bg-red-50"
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
