import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { StorageService } from './services/storage';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    const user = StorageService.getUserData();
    if (user?.isAuthenticated) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (StorageService.login(usernameInput)) {
      setIsAuthenticated(true);
      setCurrentUser(StorageService.getUserData());
      setError('');
    } else {
      setError('Access Denied. Only Sumaiya or Wajeeth can access this system.');
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsernameInput('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff0f5] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-200/40 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px]"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[32px] shadow-2xl w-full max-w-md text-center border border-white relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-rose-300 to-indigo-300 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-lg shadow-rose-200/50">
            🐨
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 font-heading">Koala Baby Tracker</h1>
          <p className="text-gray-400 mb-10 font-medium text-xs tracking-widest uppercase">Secure Cloud Access</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Username (Sumaiya / Wajeeth)"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all text-center text-lg font-medium text-gray-700 placeholder-gray-400 group-hover:bg-white"
              />
            </div>
            {error && (
              <div className="bg-rose-50 text-rose-500 text-sm py-2 px-4 rounded-xl border border-rose-100 animate-pulse">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-400 to-indigo-400 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-rose-200 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
            >
              Secure Login
            </button>
          </form>
          <p className="mt-8 text-xs text-gray-400">Restricted Access • WLS System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5f7]">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-rose-100">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-rose-100">🐨</div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 font-heading tracking-tight leading-none">Koala Baby</h1>
                    <span className="text-[10px] text-rose-400 font-bold tracking-widest uppercase">Powered by WLS</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border ${currentUser?.role === 'admin' ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentUser?.role === 'admin' ? 'bg-indigo-200 text-indigo-700' : 'bg-rose-200 text-rose-600'}`}>
                        {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-700 leading-none">{currentUser?.name}</p>
                        <p className="text-[10px] text-gray-400 leading-none mt-1 uppercase">{currentUser?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl text-gray-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
      </header>
      
      <main className="p-6 md:p-10 max-w-[1600px] mx-auto">
          <Dashboard />
      </main>
    </div>
  );
};

export default App;