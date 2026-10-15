import React,{useEffect,useMemo,useState} from 'react';
import { Baby, Heart, Lock, User } from 'lucide-react';
import { Profile } from './types';
import { StorageService } from './services/storage';
import { NotificationService } from './services/notifications';
import { Sidebar } from './components/Sidebar';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { Dashboard } from './components/Dashboard';
import { FamilyFeatures } from './components/FamilyFeatures';
import { MedicalLog } from './components/MedicalLog';
import { History } from './components/History';
import { DailyIslamicQuiz } from './components/DailyIslamicQuiz';
import { FamilySettings } from './components/FamilySettings';
import { InstallApp } from './components/InstallApp';
import { CloudSync } from './components/CloudSync';
import { CloudService, CloudStatus } from './services/cloud';
import { GeminiService } from './services/gemini';
import { localDateString } from './services/date';
import { User as FirebaseUser } from 'firebase/auth';
// Rotate the family app's soft color theme automatically each calendar day.
const dailyThemes=[
 {name:'Mint',page:'#f1faf6',header:'#e4f7ed',hero:'linear-gradient(110deg,#d1fae5,#ecfdf5,#fce7f3)',accent:'#047857'},
 {name:'Sky',page:'#f0f8ff',header:'#e3f2fd',hero:'linear-gradient(110deg,#dbeafe,#eff6ff,#e0f2fe)',accent:'#0369a1'},
 {name:'Lavender',page:'#f8f5ff',header:'#f0eaff',hero:'linear-gradient(110deg,#ede9fe,#faf5ff,#fce7f3)',accent:'#7c3aed'},
 {name:'Peach',page:'#fff8f3',header:'#fff0e6',hero:'linear-gradient(110deg,#ffedd5,#fff7ed,#fce7f3)',accent:'#c2410c'},
 {name:'Rose',page:'#fff5f8',header:'#ffe9f0',hero:'linear-gradient(110deg,#ffe4e6,#fff1f2,#fdf2f8)',accent:'#be185d'},
 {name:'Aqua',page:'#f0fdfa',header:'#ccfbf1',hero:'linear-gradient(110deg,#ccfbf1,#f0fdfa,#e0f2fe)',accent:'#0f766e'},
 {name:'Sunshine',page:'#fffdf0',header:'#fff7d6',hero:'linear-gradient(110deg,#fef3c7,#fffbeb,#fce7f3)',accent:'#a16207'}
];
const themeForDate=(date:string)=>{const [y,m,d]=date.split('-').map(Number);const day=Math.floor(Date.UTC(y,m-1,d)/86400000);return dailyThemes[((day%dailyThemes.length)+dailyThemes.length)%dailyThemes.length];};
StorageService.initialize();
const App:React.FC=()=>{const [auth,setAuth]=useState(!!StorageService.getUserData()?.isAuthenticated);const [name,setName]=useState('');const [pin,setPin]=useState('');const [error,setError]=useState('');const [tab,setTab]=useState('dashboard');const [profiles,setProfiles]=useState<Profile[]>(StorageService.getProfiles());const [selectedId,setSelectedId]=useState(StorageService.getSelectedProfileId());const [cloudStatus,setCloudStatus]=useState<CloudStatus>('offline');const [cloudUser,setCloudUser]=useState<FirebaseUser|null>(null);const [cloudRevision,setCloudRevision]=useState(0);
 const [themeDate,setThemeDate]=useState(()=>localDateString());
 const dailyTheme=themeForDate(themeDate);
 useEffect(()=>{const update=()=>setThemeDate(localDateString());const timer=window.setInterval(update,30000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
 const profile=useMemo(()=>profiles.find(p=>p.id===selectedId)||profiles[0],[profiles,selectedId]);const refreshProfiles=()=>setProfiles([...StorageService.getProfiles()]);
 useEffect(()=>CloudService.start(StorageService.exportData(),data=>{StorageService.applyCloudData(data);refreshProfiles();setCloudRevision(value=>value+1);},(status,user)=>{setCloudStatus(status);setCloudUser(user);}),[]);
 useEffect(()=>{const check=()=>NotificationService.checkReminders();check();const timer=setInterval(check,60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(!cloudUser)return;const prepare=()=>GeminiService.getDailyIslamicQuiz().then(()=>NotificationService.notifyQuizReady(localDateString()));prepare();const timer=setInterval(prepare,60000);return()=>clearInterval(timer);},[cloudUser]);
 const select=(id:string)=>{setSelectedId(id);StorageService.setSelectedProfileId(id);};const login=async(e:React.FormEvent)=>{e.preventDefault();if(await StorageService.login(name,pin)){setAuth(true);setError('');}else setError('The family name or PIN is incorrect.');};
 if(!auth)return <main className="min-h-screen flex items-center justify-center p-5" style={{background:dailyTheme.hero}}><div className="w-full max-w-sm bg-white/95 border border-emerald-100 rounded-3xl p-8 shadow-xl shadow-emerald-100/50"><div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><Baby/></div><h1 className="text-3xl font-bold mt-5">Koala Family</h1><p className="text-sm text-gray-500 mt-2">Private health records for Liya, Liyan, Sumaiya, and Wajeethu Ali.</p><form onSubmit={login} className="mt-7 space-y-3"><label className="text-xs font-bold text-gray-500">Family account<div className="relative mt-1"><User size={17} className="absolute left-3 top-3.5 text-gray-400"/><input autoFocus value={name} onChange={e=>setName(e.target.value)} className="w-full pl-10 pr-3 py-3 border bg-gray-50 rounded-lg" placeholder="Enter your name"/></div></label>{StorageService.hasPin()&&<label className="block text-xs font-bold text-gray-500">PIN<input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} className="mt-1 w-full p-3 border bg-gray-50 rounded-lg" placeholder="4–8 digits"/></label>}{error&&<p className="text-xs text-rose-600">{error}</p>}<button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold flex justify-center gap-2"><Lock size={17}/>Open tracker</button></form></div></main>;
 if(!profile)return <div className="p-10">No profiles are available.</div>;
 const content=<React.Fragment key={`${tab}-${profile.id}`}>{tab==='medical'?<MedicalLog profile={profile}/>:tab==='history'?<History profile={profile}/>:tab==='quiz'?<DailyIslamicQuiz/>:tab==='features'?<FamilyFeatures profile={profile}/>:tab==='settings'?<FamilySettings profile={profile} onProfilesChanged={refreshProfiles}/>:<Dashboard profile={profile} onNavigateToRegistry={()=>setTab('medical')}/>}</React.Fragment>;
 return <div className="min-h-screen transition-colors duration-700" style={{backgroundColor:dailyTheme.page}}><Sidebar activeTab={tab} setActiveTab={setTab}/><div className="md:ml-64"><header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/70 px-4 md:px-6 py-3" style={{backgroundColor:dailyTheme.header}}><div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2"><div className="flex items-center justify-between gap-3"><div><h1 className="font-bold text-slate-800 text-xl">{tab==='medical'?'Health log':tab==='quiz'?'தினசரி இஸ்லாமிய வினா':tab==='features'?'Family Care Center':tab==='settings'?'Family settings':tab[0].toUpperCase()+tab.slice(1)}</h1><p className="text-[11px] text-gray-400 flex gap-1 items-center"><Heart size={11}/>Liya and Liyan family care</p></div><div className="flex gap-2"><CloudSync status={cloudStatus} user={cloudUser}/><InstallApp/></div></div><ProfileSwitcher profiles={profiles} selectedId={profile.id} onSelect={select}/></div></header><main className="max-w-7xl mx-auto p-3 md:p-6 pb-28">{tab==='dashboard'&&<section className="mb-5 rounded-3xl border border-white/70 px-5 py-6 md:px-8" style={{background:dailyTheme.hero}}><p className="text-xs font-bold tracking-widest uppercase text-emerald-700">Koala Family • Health companion</p><h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2">Assalamu Alaikum! 🌿</h2><p className="text-sm text-slate-600 mt-1">Your family’s health, care and precious moments — all in one place.</p><div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>setTab('medical')} className="text-white rounded-xl px-4 py-2 text-sm font-semibold" style={{backgroundColor:dailyTheme.accent}}>+ Add health record</button><button onClick={()=>setTab('history')} className="bg-white text-emerald-800 rounded-xl px-4 py-2 text-sm font-semibold border border-emerald-200">View history</button></div></section>}{content}</main></div></div>;
};
export default App;
