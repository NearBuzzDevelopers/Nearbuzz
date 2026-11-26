import { Navigate } from 'react-router-dom';
import { useAuth, roleHomePath } from '../context/AuthContext';

/**
 * ProtectedRoute — guards routes that require authentication and optional role access.
 * If the user is logged in with a different role than allowed, redirects them
 * automatically to their own role's portal so Students and Vendors never see the wrong UI.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children;
}
