import React,{useEffect,useMemo,useState} from 'react';
import { Baby, Heart, Lock, User } from 'lucide-react';
import { Profile } from './types';
import { StorageService } from './services/storage';
import { NotificationService } from './services/notifications';
import { Sidebar } from './components/Sidebar';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { Dashboard } from './components/Dashboard';
import { FamilyFeatures } from './components/FamilyFeatures';
import { LiveTV } from './components/LiveTV';
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
const DoraKids:React.FC=()=>{
 const [season,setSeason]=useState(1);
 const episodes=[
  ['The Legend of the Big Red Chicken','Lost and Found','Hic-Boom-Ohh','Dora Wants to Visit the Beach','We All Scream for Ice Cream','Choo Choo','Treasure Island','Three Little Piggies','The Big River','Berry Hunt'],
  ['The Big Storm','Boots Toy Fire Truck','The Magic Stick','The Missing Piece','Lost Squeaky','Rojo the Firetruck','Lost Map','El Día de las Madres','The Golden Explorers','A Present for Santa'],
  ['Book of Rhymes','Trucks in Trouble','The Sun and Red Rooster','A Metal Robot','Benny the Potato','Space Creatures','The Lost City','Animal Rescue Shelter','Save the Puppy','King and Magic Crown'],
  ['Star Catcher','Family Dinner','Dora’s Present','The Fast Swiper','La Maestra de Música','Daisy, La Quinceañera','Save Diego','Baby Jaguar’s Roar','A Crown for King Juan el Bobo','Dora’s Got a Puppy'],
  ['Dora’s Jack-in-the-Box','Bark, Bark to Play Park','Dora Saves Three Kings Day','Isa’s Unicorn Flowers','Benny’s Big Race','First Day of School','The Backpack Parade','Bouncy Boots','The Mayan Adventure','Dora Saves the Three Little Piggies']
 ];
 const link='https://www.tataplaybinge.com/watch/shows/dora-the-explorer/31200';
 return <section className="space-y-5 pb-12">
  <div className="rounded-3xl bg-gradient-to-r from-purple-950 to-pink-700 p-7 text-white"><h2 className="text-3xl font-black">டோரா & புஜ்ஜி — தமிழ்</h2><p className="mt-2 text-sm">Dora the Explorer · Tamil audio listed by official streaming provider · Episode guide</p></div>
  <p className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-950">தமிழ் audio-வில் பார்க்க Tata Play Binge / JioHotstar போன்ற licensed service தேவைப்படலாம். இது Koala-வில் நேரடியாக stream ஆகாது. இந்தியா வெளியே கிடைப்பது உறுதி செய்யப்படவில்லை.</p>
  <div className="flex gap-2 overflow-x-auto">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setSeason(n)} className={'shrink-0 rounded-xl px-4 py-2 '+(season===n?'bg-purple-700 text-white':'bg-white border')}>Season {n}</button>)}</div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{episodes[season-1].map((name,i)=><article key={name} className="bg-white border rounded-xl p-4 flex justify-between items-center gap-3"><div><h3 className="font-semibold">Episode {i+1}: {name}</h3><p className="text-xs text-slate-500">Tamil audio option listed by provider · ~24 min</p></div><a href={link} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-purple-700 text-white px-3 py-2 text-sm">Watch officially</a></article>)}</div>
  <p className="text-sm text-slate-500">Additional seasons and the full licensed episode list are available on the provider website. No unauthorized uploads or unverified Tamil YouTube embeds.</p>
 </section>;
};
StorageService.initialize();
const App:React.FC=()=>{const [auth,setAuth]=useState(!!StorageService.getUserData()?.isAuthenticated);const [name,setName]=useState('');const [pin,setPin]=useState('');const [error,setError]=useState('');const [tab,setTab]=useState('dashboard');const [profiles,setProfiles]=useState<Profile[]>(StorageService.getProfiles());const [selectedId,setSelectedId]=useState(StorageService.getSelectedProfileId());const [cloudStatus,setCloudStatus]=useState<CloudStatus>('offline');const [cloudUser,setCloudUser]=useState<FirebaseUser|null>(null);const [cloudRevision,setCloudRevision]=useState(0);
 const [themeDate,setThemeDate]=useState(()=>localDateString());
 const [themeMode,setThemeMode]=useState<'daily'|'dark'|'light'>(()=>{const value=localStorage.getItem('koala_theme_mode');return value==='dark'||value==='light'?value:'daily';});
 const [language,setLanguage]=useState<'en'|'ta'>(()=>localStorage.getItem('koala_language')==='ta'?'ta':'en');
 const updateMode=(value:'daily'|'dark'|'light')=>{setThemeMode(value);localStorage.setItem('koala_theme_mode',value);};
 const updateLanguage=(value:'en'|'ta')=>{setLanguage(value);localStorage.setItem('koala_language',value);};
 const dailyTheme=themeForDate(themeDate);
 const dark=themeMode==='dark';
 const tr=(en:string,ta:string)=>language==='ta'?ta:en;
 useEffect(()=>{const update=()=>setThemeDate(localDateString());const timer=window.setInterval(update,30000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
 const profile=useMemo(()=>profiles.find(p=>p.id===selectedId)||profiles[0],[profiles,selectedId]);const refreshProfiles=()=>setProfiles([...StorageService.getProfiles()]);
 useEffect(()=>CloudService.start(StorageService.exportData(),data=>{StorageService.applyCloudData(data);refreshProfiles();setCloudRevision(value=>value+1);},(status,user)=>{setCloudStatus(status);setCloudUser(user);}),[]);
 useEffect(()=>{const check=()=>NotificationService.checkReminders();check();const timer=setInterval(check,60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(!cloudUser)return;const prepare=()=>GeminiService.getDailyIslamicQuiz().then(()=>NotificationService.notifyQuizReady(localDateString()));prepare();const timer=setInterval(prepare,60000);return()=>clearInterval(timer);},[cloudUser]);
 const select=(id:string)=>{setSelectedId(id);StorageService.setSelectedProfileId(id);};const login=async(e:React.FormEvent)=>{e.preventDefault();if(await StorageService.login(name,pin)){setAuth(true);setError('');}else setError('The family name or PIN is incorrect.');};
 if(!auth)return <main className="min-h-screen flex items-center justify-center p-5" style={{background:dailyTheme.hero}}><div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/80 rounded-[2rem] p-7 sm:p-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center"><Baby/></div><h1 className="text-3xl font-extrabold tracking-tight text-slate-800 mt-6">Koala Family</h1><p className="text-sm text-gray-500 mt-2">Private health records for Liya, Liyan, Sumaiya, and Wajeethu Ali.</p><form onSubmit={login} className="mt-7 space-y-3"><label className="text-xs font-bold text-gray-500">Family account<div className="relative mt-1"><User size={17} className="absolute left-3 top-3.5 text-gray-400"/><input autoFocus value={name} onChange={e=>setName(e.target.value)} className="w-full pl-10 pr-3 py-3.5 border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none rounded-xl transition" placeholder="Enter your name"/></div></label>{StorageService.hasPin()&&<label className="block text-xs font-bold text-gray-500">PIN<input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} className="mt-1 w-full p-3.5 border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none rounded-xl transition" placeholder="4–8 digits"/></label>}{error&&<p className="text-xs text-rose-600">{error}</p>}<button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-100 transition"><Lock size={17}/>Open tracker</button></form></div></main>;
 if(!profile)return <div className="p-10">No profiles are available.</div>;
 const content=<React.Fragment key={`${tab}-${profile.id}`}>{tab==='medical'?<MedicalLog profile={profile}/>:tab==='history'?<History profile={profile}/>:tab==='quiz'?<DailyIslamicQuiz/>:tab==='features'?<FamilyFeatures profile={profile}/>:tab==='tv'?<LiveTV/>:tab==='kids'?<DoraKids/>:tab==='settings'?<FamilySettings profile={profile} onProfilesChanged={refreshProfiles}/>:<Dashboard profile={profile} onNavigateToRegistry={()=>setTab('medical')}/>}</React.Fragment>;
 return <div className="min-h-screen transition-colors duration-700" style={{backgroundColor:dark?"#0f172a":themeMode==='light'?"#f8fafc":dailyTheme.page}}><Sidebar activeTab={tab} setActiveTab={setTab}/><div className="md:ml-64"><header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/70 px-4 md:px-8 py-3 shadow-sm" style={{backgroundColor:dark?"#1e293b":themeMode==='light'?"#ffffff":dailyTheme.header}}><div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2"><div className="flex items-center justify-between gap-3"><div><h1 className={'font-bold text-xl '+(dark?'text-white':'text-slate-800')}>{tab==='medical'?tr('Health log','மருத்துவ பதிவுகள்'):tab==='quiz'?'தினசரி இஸ்லாமிய வினா':tab==='features'?tr('Family Care Center','குடும்ப பராமரிப்பு'):tab==='tv'?'Live TV':tab==='kids'?'Dora & Bujji':tab==='settings'?tr('Family settings','குடும்ப அமைப்புகள்'):tr('Dashboard','முகப்பு')}</h1><p className="text-[11px] text-gray-400 flex gap-1 items-center"><Heart size={11}/>Liya and Liyan family care</p></div><div className="flex gap-2"><CloudSync status={cloudStatus} user={cloudUser}/><InstallApp/></div></div><div className="flex flex-col gap-2"><div className="flex flex-wrap gap-2 items-center"><label className="sr-only" htmlFor="koala-language">Language</label><select id="koala-language" value={language} onChange={e=>updateLanguage(e.target.value as 'en'|'ta')} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="en">English</option><option value="ta">தமிழ்</option></select><label className="sr-only" htmlFor="koala-theme">Appearance</label><select id="koala-theme" value={themeMode} onChange={e=>updateMode(e.target.value as 'daily'|'dark'|'light')} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="daily">Daily theme</option><option value="light">Light</option><option value="dark">Dark</option></select></div><ProfileSwitcher profiles={profiles} selectedId={profile.id} onSelect={select}/></div></div></header><main className={"max-w-7xl mx-auto p-4 md:p-8 pb-28 space-y-5 "+(dark?"koala-dark":"")}>{tab==='dashboard'&&<section className="mb-5 rounded-[2rem] border border-white/80 px-6 py-8 md:px-10 md:py-10 shadow-[0_16px_45px_rgba(15,23,42,0.04)] relative overflow-hidden" style={{background:dailyTheme.hero}}><p className="inline-flex rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-extrabold tracking-widest uppercase text-emerald-700">Koala Family • Health companion</p><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 mt-4">{tr("Assalamu Alaikum! 🌿","அஸ்ஸலாமு அலைக்கும்! 🌿")}</h2><p className="text-sm md:text-base text-slate-600 mt-3 max-w-xl">{tr("Your family’s health, care and precious moments — all in one place.","உங்கள் குடும்பத்தின் ஆரோக்கியம், பராமரிப்பு மற்றும் இனிய நினைவுகள் ஒரே இடத்தில்.")}</p><div className="flex flex-wrap gap-3 mt-6"><button onClick={()=>setTab('medical')} className="text-white rounded-2xl px-5 py-3 text-sm font-bold shadow-md transition hover:scale-[1.02]" style={{backgroundColor:dailyTheme.accent}}>{tr("+ Add health record","+ மருத்துவ பதிவு")}</button><button onClick={()=>setTab('history')} className="bg-white/90 text-emerald-800 rounded-2xl px-5 py-3 text-sm font-bold border border-emerald-100 shadow-sm hover:bg-white transition">{tr("View history","பதிவுகள் வரலாறு")}</button></div></section>}{content}</main></div></div>;
};
export default App;
