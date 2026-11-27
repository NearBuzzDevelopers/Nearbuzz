import { Routes, Route, Navigate } from 'react-router-dom';
import ExplorePage from './pages/ExplorePage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import UpdatesFeedPage from './pages/UpdatesFeedPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VendorPortalPage from './pages/VendorPortalPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public Discovery Routes */}
      <Route path="/" element={<ExplorePage />} />
      <Route path="/businesses/:id" element={<BusinessDetailPage />} />
      <Route path="/feed" element={<UpdatesFeedPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Vendor Onboarding & Type-Specific Dashboard Routes */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/:businessType"
        element={
          <ProtectedRoute allowedRoles={['VENDOR']}>
            <VendorPortalPage />
          </ProtectedRoute>
        }
      />

      {/* Explicit Shop Registration for Students upgrading to Vendor */}
      <Route
        path="/register-shop"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'VENDOR']}>
            <VendorPortalPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback: Any other URL redirects to Discover home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
