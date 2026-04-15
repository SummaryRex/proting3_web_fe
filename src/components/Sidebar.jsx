import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Calendar, DollarSign, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LogoutModal from './modals/LogoutModal';
import iconImg from '../assets/Icon.png';

const navItems = [
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { label: 'Damage Reports', route: '/damage-reports', icon: AlertTriangle },
  { label: 'Maintenance Scheduling', route: '/maintenance-scheduling', icon: Calendar },
  { label: 'Cost Monitoring', route: '/cost-monitoring', icon: DollarSign },
  { label: 'User Management', route: '/user-management', icon: Users },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    navigate('/');
  };

  // Derive user display info from auth context
  const userName = user?.name || 'User';
  const userRole = user?.role || 'Guest';
  const userInitials = user?.initials || userName.charAt(0).toUpperCase();

  return (
    <>
      <aside className="w-[220px] min-w-[220px] bg-djati-sidebar border-r border-white/[0.06] p-[1.4rem_1rem] flex flex-col gap-2.5 sticky top-0 h-screen overflow-y-auto box-border">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-1">
          <img src={iconImg} alt="DJATI logo" className="w-8 h-8 object-contain" />
          <span className="text-[1.05rem] font-extrabold text-djati-amber tracking-wide">DJATI Mining</span>
        </div>

        {/* Profile — now dynamic from AuthContext */}
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] mb-1">
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#ff9800] to-[#e65100] flex items-center justify-center font-extrabold text-[0.95rem] text-white flex-shrink-0">
            {userInitials}
          </div>
          <div>
            <strong className="block text-[0.82rem] text-djati-text-bright font-semibold">{userName}</strong>
            <small className="text-[0.7rem] text-white/40">{userRole}</small>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 mt-1 flex-1">
          {navItems.map((item) => {
            const active = item.route === location.pathname;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => item.route && navigate(item.route)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border-none w-full text-left cursor-pointer font-primary text-[0.82rem] transition-colors duration-200
                  ${active
                    ? 'bg-djati-amber text-[#111] font-bold'
                    : 'bg-transparent text-djati-amber font-medium hover:bg-[rgba(255,152,0,0.08)]'
                  }`}
              >
                <span className={`flex-shrink-0 ${active ? 'opacity-100' : 'opacity-80'}`}>
                  <Icon size={18} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-white/[0.06] pt-2.5 mt-1">
          <button
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

      {showLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}
    </>
  );
}
