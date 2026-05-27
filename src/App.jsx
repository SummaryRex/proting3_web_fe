import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// PUBLIC
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";

// MAIN PAGES
import Dashboard from "./pages/Dashboard";
import DamageReport from "./pages/DamageReport";
import MaintenanceScheduling from "./pages/MaintenanceScheduling";
import UserManagement from "./pages/UserManagement";
import CostMonitoring from "./pages/CostMonitoring";

// ✅ VEHICLES
import VehiclesPage from "./pages/VehiclesPage";

// ✅ VEHICLE ASSIGNMENT
import VehicleAssignmentsPage from "./pages/VehicleAssignmentsPage";

// OPTIONAL 404
function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#121212] text-white">
      <h1 className="text-2xl font-bold">
        404 - Page Not Found
      </h1>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* =========================
              PROTECTED ROUTES
          ========================= */}

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* DAMAGE REPORT */}
          <Route
            path="/damage-reports"
            element={
              <ProtectedRoute>
                <DamageReport />
              </ProtectedRoute>
            }
          />

          {/* ✅ VEHICLES */}
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ VEHICLE ASSIGNMENT */}
          <Route
            path="/vehicle-assignments"
            element={
              <ProtectedRoute>
                <VehicleAssignmentsPage />
              </ProtectedRoute>
            }
          />

          {/* MAINTENANCE */}
          <Route
            path="/maintenance-scheduling"
            element={
              <ProtectedRoute>
                <MaintenanceScheduling />
              </ProtectedRoute>
            }
          />

          {/* USER MANAGEMENT */}
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* COST MONITORING */}
          <Route
            path="/cost-monitoring"
            element={
              <ProtectedRoute>
                <CostMonitoring />
              </ProtectedRoute>
            }
          />

          {/* =========================
              FALLBACK ROUTE
          ========================= */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;