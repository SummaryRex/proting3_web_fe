import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// VEHICLES
import VehiclesPage from "./pages/VehiclesPage";

// VEHICLE ASSIGNMENT
import VehicleAssignmentsPage from "./pages/VehicleAssignmentsPage";

// ADMIN INVENTORY / FINANCE
import InventoryPage from "./pages/InventoryPage";
import FinanceTransactionsPage from "./pages/FinanceTransactionsPage";

// OPTIONAL 404
function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#121212] text-white">
      <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
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
              PROTECTED ROUTES - ADMIN
          ========================= */}

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
            path="/vehicles"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicle-assignments"
            element={
              <ProtectedRoute>
                <VehicleAssignmentsPage />
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

          {/* =========================
              INVENTORY
              Approval sparepart cukup di InventoryPage
          ========================= */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* 
            Route lama /part-requests tidak lagi membuka page sendiri.
            Ini dibuat redirect supaya tidak error kalau masih ada link lama.
          */}
          <Route
            path="/part-requests"
            element={
              <ProtectedRoute>
                <Navigate to="/inventory" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance-transactions"
            element={
              <ProtectedRoute>
                <FinanceTransactionsPage />
              </ProtectedRoute>
            }
          />

          {/* 
            Cost estimate sudah dihapus dari flow.
            Kalau ada akses lama ke /cost-estimates, arahkan ke cost monitoring.
          */}
          <Route
            path="/cost-estimates"
            element={
              <ProtectedRoute>
                <Navigate to="/cost-monitoring" replace />
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