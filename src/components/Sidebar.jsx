import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  LogOut,
  Truck,
  Package,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import LogoutModal from "./modals/LogoutModal";
import iconImg from "../assets/Icon.png";

const navSections = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        route: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Damage Reports",
        route: "/damage-reports",
        icon: AlertTriangle,
      },
      {
        label: "Vehicles",
        route: "/vehicles",
        icon: Truck,
      },
      {
        label: "Vehicle Assignment",
        route: "/vehicle-assignments",
        icon: Users,
      },
      {
        label: "Maintenance Scheduling",
        route: "/maintenance-scheduling",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        label: "Sparepart Inventory",
        route: "/inventory",
        icon: Package,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Finance Transactions",
        route: "/finance-transactions",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "User Management",
        route: "/user-management",
        icon: Users,
      },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    navigate("/");
  };

  const isActiveRoute = (route) => {
    if (!route) return false;

    if (route === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
    );
  };

  const userName = user?.name || user?.username || "User";
  const userRole = user?.role || "Guest";

  const userInitials =
    user?.initials ||
    userName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <aside className="w-[220px] min-w-[220px] bg-djati-sidebar border-r border-white/[0.06] p-[1.4rem_1rem] flex flex-col gap-2.5 sticky top-0 h-screen overflow-y-auto box-border">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-1">
          <img
            src={iconImg}
            alt="DJATI logo"
            className="w-8 h-8 object-contain"
          />

          <span className="text-[1.05rem] font-extrabold text-djati-amber tracking-wide">
            DJATI Mining
          </span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] mb-1">
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#ff9800] to-[#e65100] flex items-center justify-center font-extrabold text-[0.95rem] text-white flex-shrink-0">
            {userInitials}
          </div>

          <div className="min-w-0">
            <strong className="block text-[0.82rem] text-djati-text-bright font-semibold truncate">
              {userName}
            </strong>

            <small className="text-[0.7rem] text-white/40 capitalize">
              {userRole}
            </small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 mt-1 flex-1">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <p className="px-3.5 text-[0.65rem] uppercase tracking-[0.12em] text-white/30 font-bold mb-0.5">
                {section.title}
              </p>

              {section.items.map((item) => {
                const active = isActiveRoute(item.route);
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border-none w-full text-left cursor-pointer font-primary text-[0.82rem] transition-colors duration-200
                      ${
                        active
                          ? "bg-djati-amber text-[#111] font-bold"
                          : "bg-transparent text-djati-amber font-medium hover:bg-[rgba(255,152,0,0.08)]"
                      }`}
                  >
                    <span
                      className={`flex-shrink-0 ${
                        active ? "opacity-100" : "opacity-80"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-white/[0.06] pt-2.5 mt-1">
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border-none w-full text-left cursor-pointer font-primary text-[0.82rem] font-semibold text-status-critical bg-transparent transition-colors duration-200 hover:bg-[rgba(244,67,54,0.1)]"
          >
            <span className="flex-shrink-0">
              <LogOut size={18} />
            </span>

            Logout
          </button>
        </div>
      </aside>

      {showLogout && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}