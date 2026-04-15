import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route guard — redirects to /login if user is not authenticated.
 * Shows nothing during the initial auth check (prevents flash of login page).
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Still checking localStorage for stored session — show nothing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-djati-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-djati-amber/30 border-t-djati-amber rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
