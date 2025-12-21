import React from 'react';
import { LayoutDashboard, Stethoscope, MessageCircleHeart, LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medical', label: 'Medical Log', icon: Stethoscope },
    { id: 'ai', label: 'Koala AI', icon: MessageCircleHeart },
  ];

  return (
    <div className="w-20 md:w-72 bg-white h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col fixed left-0 top-0 z-50 border-r border-gray-100">
      <div className="p-8 flex items-center justify-center md:justify-start gap-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-emerald-100">🐨</div>
        <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-800 font-heading tracking-tight leading-none">Koala Baby</h1>
            <span className="text-xs text-emerald-600 font-semibold tracking-wide">MEDICAL SYSTEM</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={22} className={isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="hidden md:block text-sm">{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden md:block"></div>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 mb-2">
        <div className="hidden md:flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">S</div>
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-700 truncate">Sumaiya</p>
                <p className="text-[10px] text-gray-400 truncate">Administrator</p>
            </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={22} />
          <span className="hidden md:block text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};