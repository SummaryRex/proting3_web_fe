import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DamageReport from "./pages/DamageReport";
import MaintenanceScheduling from "./pages/MaintenanceScheduling";
import UserManagement from "./pages/UserManagement";
import CostMonitoring from "./pages/CostMonitoring";

// optional: simple 404 page
function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen text-white">
      <h1>404 - Page Not Found</h1>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/damage-reports"
            element={
              <ProtectedRoute>
                <DamageReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance-scheduling"
            element={
              <ProtectedRoute>
                <MaintenanceScheduling />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cost-monitoring"
            element={
              <ProtectedRoute>
                <CostMonitoring />
              </ProtectedRoute>
            }
          />

          {/* 🔥 IMPORTANT: fallback route */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;