import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';
import {
  LayoutDashboard,
  Images,
  Heart,
  HardDrive,
  User,
  ShieldCheck,
  Cloud,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { stats } = useAuth();

  const totalUsed = stats?.totalBytesUsed || 0;
  const quota = stats?.quotaBytes || 52428800;
  const percentUsed = stats?.percentUsed || 0;
  const totalPhotos = stats?.totalPhotos || 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'gallery',
      label: 'All Photos',
      icon: Images,
      badge: totalPhotos > 0 ? totalPhotos : null,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Storage & Settings',
      icon: HardDrive,
      badge: null,
    },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-50/90 md:bg-transparent border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Library
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (item.id === 'gallery' && currentTab === 'favorites' && false);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    currentTab === item.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${currentTab === item.id ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        currentTab === item.id
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Info Box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Private & Encrypted</span>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Your photos are isolated in your personal cloud. Only you have access.
            </p>
          </div>
        </div>

        {/* Storage Widget Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              Cloud Storage
            </span>
            <span className="text-xs font-bold text-slate-900">{percentUsed}%</span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 90
                  ? 'bg-rose-500'
                  : percentUsed > 75
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
            <span>{formatBytes(totalUsed)} used</span>
            <span>{formatBytes(quota)} total</span>
          </div>

          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/80 transition-colors"
          >
            <span>Manage Storage</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${
            currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => handleNavClick('gallery')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${
            currentTab === 'gallery' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Images className="w-5 h-5" />
          <span>Gallery</span>
        </button>
        <button
          onClick={() => handleNavClick('favorites')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${
            currentTab === 'favorites' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>Favorites</span>
        </button>
        <button
          onClick={() => handleNavClick('profile')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg ${
            currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </button>
      </nav>
    </>
  );
};
