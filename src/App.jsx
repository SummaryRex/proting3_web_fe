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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes — require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/damage-reports" element={<ProtectedRoute><DamageReport /></ProtectedRoute>} />
          <Route path="/maintenance-scheduling" element={<ProtectedRoute><MaintenanceScheduling /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/cost-monitoring" element={<ProtectedRoute><CostMonitoring /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;