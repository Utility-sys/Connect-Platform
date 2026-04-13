import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  BarChart3, 
  LogOut, 
  Shield, 
  Menu,
  X,
  Bell
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => `
      flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group
      ${isActive 
        ? 'bg-accent text-white shadow-lg shadow-accent/20' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
    `}
  >
    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
    <span className="font-semibold text-sm tracking-tight">{label}</span>
  </NavLink>
);

const DashboardLayout = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-navy flex text-white overflow-hidden selection:bg-fire/30">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 h-full glass transition-transform duration-300 ease-in-out border-r border-white/5
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="px-2 mb-10 flex flex-col gap-1">
            <img src="/logo.png" alt="Connect" className="h-10 w-auto object-contain object-left mb-1" />
            <div className="h-0.5 w-12 bg-fire rounded-full" />
            <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em] mt-1">Admin System</p>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem to="/" icon={LayoutDashboard} label="Overview" />
            <SidebarItem to="/users" icon={Users} label="User Management" />
            <SidebarItem to="/venues" icon={MapPin} label="Venue Moderation" />
            <SidebarItem to="/analytics" icon={BarChart3} label="System Analytics" />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-4 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent">
                {admin?.firstName?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{admin?.firstName} {admin?.lastName}</p>
                <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-widest">{admin?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-danger hover:bg-danger/10 transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span className="font-bold text-sm">Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full h-20 glass border-b border-white/5 flex items-center justify-between px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>

          <div className="flex-1 px-4 lg:px-0">
            <h1 className="text-lg font-bold tracking-tight text-white hidden md:block">
              {window.location.pathname === '/' ? 'System Overview' : 
               window.location.pathname.includes('users') ? 'User Management' :
               window.location.pathname.includes('venues') ? 'Venue Moderation' : 'Analytics'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 relative group">
              <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full border-2 border-background"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 pb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
