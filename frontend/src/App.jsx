import { Routes, Route, Navigate } from 'react-router-dom';
import ExplorePage from './pages/ExplorePage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import UpdatesFeedPage from './pages/UpdatesFeedPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public Discovery Routes */}
      <Route path="/" element={<ExplorePage />} />
      <Route path="/businesses/:id" element={<BusinessDetailPage />} />
      <Route path="/feed" element={<UpdatesFeedPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes (Requires Login) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback: Any other URL redirects to Discover home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
