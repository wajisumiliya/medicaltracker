import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Stethoscope, History, MessageCircleHeart, Camera } from 'lucide-react';
import { StorageService } from '../services/storage';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<User | null>(StorageService.getUserData());
  const [globalImage, setGlobalImage] = useState<string | null>(StorageService.getGlobalProfileImage());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setUserData(StorageService.getUserData());
      setGlobalImage(e.detail || StorageService.getGlobalProfileImage());
    };
    window.addEventListener('koalaProfileUpdate', handleUpdate);
    return () => window.removeEventListener('koalaProfileUpdate', handleUpdate);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medical', label: 'Registry', icon: Stethoscope },
    { id: 'history', label: 'History', icon: History },
    { id: 'ai', label: 'Koala AI', icon: MessageCircleHeart },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        StorageService.saveProfileImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="hidden md:flex w-72 bg-white h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-col fixed left-0 top-0 z-50 border-r border-rose-100">
      <div className="p-8 flex items-center gap-4">
        <div 
          onClick={triggerUpload}
          className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center shadow-sm border border-rose-100 cursor-pointer group relative overflow-hidden shrink-0"
        >
          {globalImage ? (
            <img src={globalImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🐨</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={16} className="text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div>
            <h1 className="text-xl font-bold text-gray-800 font-heading tracking-tight leading-none">Koala Baby</h1>
            <span className="text-[10px] text-rose-400 font-bold tracking-widest uppercase">Medical System</span>
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
                  ? 'bg-rose-50 text-rose-700 font-bold shadow-sm ring-1 ring-rose-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={22} className={isActive ? 'text-rose-600' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="text-sm">{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 bg-rose-100 text-rose-600 border border-rose-200 shadow-inner`}>
                {globalImage ? (
                  <img src={globalImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">🐨</span>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-700 truncate">{userData?.name}</p>
                <p className="text-[10px] text-gray-400 truncate uppercase tracking-widest">{userData?.role}</p>
            </div>
        </div>
      </div>
    </div>
  );
};