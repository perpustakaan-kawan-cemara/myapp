import React from 'react';
import { LayoutDashboard, Library, Settings, BookOpen, Menu, X, BarChart3, ClipboardCheck, LogOut } from 'lucide-react';
import { TabType } from '../types';
import { getDriveImageUrl } from '../utils';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  config?: any; // Add config to optionally pass logo
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, config }: SidebarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dasbor Utama', mobileLabel: 'Dasbor', icon: LayoutDashboard },
    { id: 'books_management', label: 'Koleksi & Katalog', mobileLabel: 'Katalog', icon: Library },
    { id: 'borrow', label: 'Sirkulasi Peminjaman', mobileLabel: 'Sirkulasi', icon: ClipboardCheck },
    { id: 'traffic', label: 'Statistik Pengunjung', mobileLabel: 'Statistik', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan Sistem', mobileLabel: 'Setelan', icon: Settings },
  ] as const;

  return (
    <>
      {/* Desktop Sidebar (Persistent left bar) */}
      <div className={`hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-lg ${config?.libraryLogoUrl || config?.libraryLogoId ? 'bg-transparent shadow-none p-0' : 'bg-indigo-500 shadow-indigo-500/20'}`}>
              {config?.libraryLogoUrl || config?.libraryLogoId ? (
                imageError ? (
                  <BookOpen className="w-6 h-6 text-white" />
                ) : (
                  <img 
                    src={getDriveImageUrl(config.libraryLogoId || config.libraryLogoUrl)} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain rounded bg-white" 
                    onError={() => setImageError(true)}
                  />
                )
              ) : (
                <BookOpen className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight">Menu</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-semibold' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-200' : ''}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-800 space-y-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium border border-red-500/20 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar (Logout)</span>
          </button>
          <div className="text-xs text-gray-500 text-center font-medium bg-gray-800/50 py-3 rounded-lg">
            Copyright @xdmrproject
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Footer Navigation (Android Style) */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-lg border border-slate-800 rounded-2xl px-2 py-2.5 shadow-xl shadow-slate-950/40 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-0.5 focus:outline-none transition-all active:scale-95 cursor-pointer"
            >
              <div className={`relative px-4 py-1.5 rounded-full transition-all duration-300 mb-1 flex items-center justify-center ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] tracking-wide transition-all ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 font-semibold'
              }`}>
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
