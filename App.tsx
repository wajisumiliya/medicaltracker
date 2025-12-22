import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MedicalLog } from './components/MedicalLog';
import { History } from './components/History';
import { AiAssistant } from './components/AiAssistant';
import { Sidebar } from './components/Sidebar';
import { StorageService } from './services/storage';
import { ShieldCheck, Heart, Baby, Sparkles, Clock, Calendar, Lock, User as UserIcon, Stars } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalImage, setGlobalImage] = useState<string | null>(StorageService.getGlobalProfileImage());
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const user = StorageService.getUserData();
    if (user?.isAuthenticated) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }

    const handleUpdate = (e: any) => {
      const newImage = e.detail || StorageService.getGlobalProfileImage();
      setGlobalImage(newImage);
      const updatedUser = StorageService.getUserData();
      if (updatedUser) setCurrentUser(updatedUser);
    };

    window.addEventListener('koalaProfileUpdate', handleUpdate);
    return () => window.removeEventListener('koalaProfileUpdate', handleUpdate);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError('Please tell us your name.');
      return;
    }

    if (StorageService.login(usernameInput)) {
      setIsAuthenticated(true);
      setCurrentUser(StorageService.getUserData());
      setError('');
    } else {
      setError('Oops! That name isn\'t in our nursery list.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigateToRegistry={() => setActiveTab('medical')} />;
      case 'medical': return <MedicalLog onBackToDashboard={() => setActiveTab('dashboard')} />;
      case 'history': return <History />;
      case 'ai': return <AiAssistant />;
      default: return <Dashboard onNavigateToRegistry={() => setActiveTab('medical')} />;
    }
  };

  const renderIdentityIcon = (sizeClass: string, emojiSize: string) => (
    <div className={`${sizeClass} bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-rose-50`}>
      {globalImage ? (
        <img src={globalImage} alt="Identity" className="w-full h-full object-cover" />
      ) : (
        <span className={emojiSize}>🐨</span>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcf5] font-sans selection:bg-rose-100 selection:text-rose-600 overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-sky-100/50 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-rose-100/50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="w-full max-w-[460px] px-6 relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-rose-200 blur-2xl opacity-30 rounded-full"></div>
                <div className="relative w-24 h-24 bg-white rounded-[40px] shadow-xl shadow-rose-200/20 mb-6 border-4 border-rose-50 flex items-center justify-center group transition-transform hover:scale-110 overflow-hidden">
                  {globalImage ? (
                    <img src={globalImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl drop-shadow-sm">🐨</span>
                  )}
                </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 font-heading tracking-tight">Koala Nursery</h1>
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-widest">
              <Baby size={16} />
              <span>Wajeeth + Sumaiya = Liya</span>
            </div>
          </div>

          <div className="bg-white rounded-[48px] shadow-[0_24px_60px_rgba(255,182,193,0.15)] border-4 border-white p-10 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-200 via-rose-200 to-amber-200"></div>
            
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <label className="text-[11px] font-bold text-rose-300 uppercase tracking-widest absolute -top-2.5 left-6 bg-white px-2 z-10">Who's checking in?</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-5 w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-300">
                        <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Name"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-rose-50/30 border-2 border-rose-50 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-rose-100 focus:bg-white focus:border-rose-200 transition-all text-gray-700 font-bold placeholder:text-rose-200 text-lg shadow-inner"
                    />
                  </div>
                </div>

              {error && (
                <div className="bg-rose-50/80 backdrop-blur-sm text-rose-500 text-xs font-bold py-4 px-5 rounded-[20px] border-2 border-rose-100 animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-5 rounded-[28px] font-bold text-xl hover:bg-rose-500 transition-all duration-300 shadow-xl shadow-rose-100 active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
              >
                Enter Nursery <Heart size={22} className="fill-white" />
              </button>
            </form>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-[11px] text-gray-300 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              Wajeeth + Sumaiya = Liya <Heart size={10} className="text-rose-200" />
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffcfc] flex font-sans overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <div className="flex-1 md:ml-72 min-h-screen flex flex-col">
        <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-50 flex items-center justify-between px-4 md:px-10 py-5">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-heading capitalize tracking-tight">{activeTab}</h2>
            <div className="flex items-center gap-4 mt-1">
               <div className="flex items-center gap-1.5 text-emerald-500">
                  <ShieldCheck size={12} />
                  <p className="text-[9px] font-bold tracking-widest uppercase">Secured</p>
               </div>
               <div className="hidden sm:flex items-center gap-3 text-gray-400 font-medium">
                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Calendar size={10} className="text-rose-400" />
                    {currentDateTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Clock size={10} className="text-indigo-400" />
                    {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl border bg-rose-50/50 border-rose-100">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden border border-rose-400/20">
                      {globalImage ? (
                        <img src={globalImage} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">🐨</span>
                      )}
                  </div>
                  <div className="hidden md:block text-right">
                      <p className="text-xs font-bold text-gray-800 leading-none">{currentUser?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold leading-none mt-1.5 uppercase tracking-tighter">{currentUser?.role}</p>
                  </div>
              </div>
          </div>
        </header>
        
        <main className="p-4 md:p-10 max-w-[1400px] w-full mx-auto flex-1">
          {renderContent()}
        </main>

        <footer className="w-full bg-white border-t border-gray-50 px-6 py-10 mt-auto">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center overflow-hidden border border-rose-100">
                  {globalImage ? (
                    <img src={globalImage} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">🐨</span>
                  )}
                </div>
                <span className="font-heading font-bold text-gray-800">Koala Baby Tracker</span>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                A private medical tracking system specifically designed for Sumaiya's pregnancy journey. All data is stored locally in your browser.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-50 flex items-center justify-center text-[12px] font-bold text-rose-600 overflow-hidden">
                    {globalImage ? (
                      <img src={globalImage} alt="Mom" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐨</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">W</div>
                </div>
              </div>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                Made with <Heart size={10} className="fill-rose-400" /> for Wajeeth + Sumaiya = Liya
              </p>
              <p className="text-[9px] text-gray-300 font-bold mt-1 tracking-widest uppercase">
                2025-2026 Journey
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                      <Lock size={10} /> Local Encryption
                   </div>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                      <Sparkles size={10} /> Gemini AI Integrated
                   </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="text-[9px] text-gray-300 font-medium text-center md:text-right">
                Version 1.2.7 (Authenticated)<br/>
                All Rights Reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;