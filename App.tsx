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
type LicensedMovie={id:string;title:string;language:string;year:number;quality:'HD'|'Full HD'|'4K';poster?:string;provider:'vimeo'|'commons';videoId:string;rightsNote:string};
const APPROVED_MOVIES:ReadonlyArray<LicensedMovie>=[{id:'sita-sings-the-blues',title:'Sita Sings the Blues',language:'English',year:2008,quality:'HD',provider:'commons',videoId:'Sita Sings the Blues.webm',poster:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sita%20STB%20Poster%20Agni%20A2.png',rightsNote:'Nina Paley, CC0 Wikimedia copy, 81m31s at 720p; copyrighted soundtrack removed from this file, so some audio is missing.'},{"id":"pendatang-2023","title":"Pendatang","language":"Other","year":2023,"quality":"HD","provider":"commons","videoId":"PENDATANG (2023) full movie.webm","rightsNote":"Kuman Pictures · CC BY 3.0 · https://creativecommons.org/licenses/by/3.0/ · Full-length Malaysian feature film. Attribution: Kuman Pictures. Quality depends on available Wikimedia stream."},{"id":"caligari-1920","title":"The Cabinet of Dr. Caligari","language":"Other","year":1920,"quality":"Full HD","provider":"commons","videoId":"The Cabinet of Dr. Caligari (1920).webm","rightsNote":"Public domain film · 75 min · Wikimedia Commons 1080p encode. Silent German film."},{"id":"general-1926","title":"The General","language":"English","year":1926,"quality":"HD","provider":"commons","videoId":"The General 1926 720p.webm","rightsNote":"Public domain listing on Wikimedia Commons · 79 min · 720p · silent film."},{"id":"squaw-1914","title":"The Squaw Man","language":"English","year":1914,"quality":"HD","provider":"commons","videoId":"The Squaw Man (1914) by Cecil B. DeMille and Oscar Apfel.webm","rightsNote":"Public domain film · 72 min · 720p silent western."}];
// Add a movie only after checking that it is a full-length film, the owner
// authorizes playback in Koala, and Vimeo permits embedding on this domain.
const Movies:React.FC=()=>{
 const categories=[['Tamil','ta'],['Hindi','hi'],['English','en'],['Malayalam','ml'],['Telugu','te'],['Kannada','kn'],['Bengali','bn'],['Japanese','ja'],['Korean','ko'],['Spanish','es'],['French','fr'],['Chinese','zh']];
 const [language,setLanguage]=useState('Tamil');
 const [search,setSearch]=useState('');
 const [page,setPage]=useState(1);
 const [apiKey,setApiKey]=useState(()=>localStorage.getItem('koala_tmdb_read_token')||'');
 const [keyInput,setKeyInput]=useState('');
 const [settings,setSettings]=useState(false);
 const [results,setResults]=useState<Array<{id:number;title:string;poster_path:string|null;release_date?:string;vote_average?:number;overview?:string}>>([]);
 const [total,setTotal]=useState(0);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [trailer,setTrailer]=useState<string|null>(null);
 const [selected,setSelected]=useState<LicensedMovie|null>(null);
 const [favorites,setFavorites]=useState<number[]>(()=>{try{const v=JSON.parse(localStorage.getItem('koala_movie_favorites_v2')||'[]');return Array.isArray(v)?v:[]}catch{return []}});
 useEffect(()=>{localStorage.setItem('koala_movie_favorites_v2',JSON.stringify(favorites))},[favorites]);
 useEffect(()=>{setPage(1);setResults([])},[language,search]);
 useEffect(()=>{
  if(!apiKey){setResults([]);setTotal(0);return}
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);setError('');
   try{
    const params=new URLSearchParams({page:String(page),include_adult:'false',sort_by:'popularity.desc',with_original_language:categories.find(x=>x[0]===language)?.[1]||'en'});
    const q=search.trim();
    const url=q?'https://api.themoviedb.org/3/search/movie?'+new URLSearchParams({query:q,page:String(page),include_adult:'false'}):'https://api.themoviedb.org/3/discover/movie?'+params;
    const res=await fetch(url,{headers:{Authorization:'Bearer '+apiKey,accept:'application/json'},signal:controller.signal});
    if(!res.ok)throw Error(res.status===401?'Invalid TMDb Read Access Token':'Movie database unavailable ('+res.status+')');
    const data=await res.json();
    if(!controller.signal.aborted){setResults(Array.isArray(data.results)?data.results:[]);setTotal(Number(data.total_results)||0)}
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load movies')}
   finally{if(!controller.signal.aborted)setLoading(false)}
  },300);
  return()=>{clearTimeout(timer);controller.abort()}
 },[apiKey,language,search,page]);
 const openTrailer=async(id:number)=>{
  try{const res=await fetch('https://api.themoviedb.org/3/movie/'+id+'/videos',{headers:{Authorization:'Bearer '+apiKey}});if(!res.ok)throw Error();const data=await res.json();const video=(data.results||[]).find((v:{site:string;type:string;key:string})=>v.site==='YouTube'&&v.type==='Trailer');if(video)setTrailer(video.key);else setError('No official trailer available for this title.')}catch{setError('Unable to load trailer.')}
 };
 const saveKey=()=>{const key=keyInput.trim();if(!key){setError('Enter your TMDb API Read Access Token.');return}localStorage.setItem('koala_tmdb_read_token',key);setApiKey(key);setSettings(false);setPage(1);setError('')};
 const toggle=(id:number)=>setFavorites(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 return <section className="space-y-5 pb-12">
 <div className="rounded-3xl bg-gradient-to-r from-slate-950 to-indigo-900 p-8 text-white"><h2 className="text-3xl font-black">Koala Movies</h2><p className="mt-2 text-indigo-100">Explore thousands of movies across languages. Trailers and details are not full-movie streams.</p><p className="text-xs text-indigo-200 mt-3">Movie data and images from TMDb. This product is not endorsed or certified by TMDb.</p></div>
 <div className="bg-white rounded-2xl border p-4"><button onClick={()=>setSettings(v=>!v)} className="rounded-xl bg-slate-900 text-white px-4 py-2">{apiKey?'TMDb settings':'Connect TMDb movie catalog'}</button>{(settings||!apiKey)&&<div className="mt-3 space-y-2"><p className="text-sm text-slate-600">Enter your TMDb API Read Access Token to browse the full catalog. The token is stored only in this browser. For a shared production catalog, configure a secure server-side proxy instead.</p><input type="password" value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="TMDb API Read Access Token" aria-label="TMDb token" className="border rounded-xl p-3 w-full"/><button onClick={saveKey} className="rounded-xl bg-indigo-700 text-white px-4 py-2">Connect</button>{apiKey&&<button onClick={()=>{localStorage.removeItem('koala_tmdb_read_token');setApiKey('');setKeyInput('');setSettings(false)}} className="ml-2 rounded-xl border px-4 py-2">Disconnect</button>}</div>}</div>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search movie titles" aria-label="Search movies" className="w-full border rounded-xl p-3"/>
 <div className="flex gap-2 overflow-x-auto">{categories.map(([name])=><button key={name} onClick={()=>setLanguage(name)} className={'shrink-0 rounded-full px-4 py-2 '+(language===name?'bg-indigo-700 text-white':'bg-white border')}>{name}</button>)}</div>
 {apiKey&&<p className="text-sm text-slate-600">{search?'Search results':'Browse '+language+' movies'} · {total.toLocaleString()} titles found · Page {page}</p>}
 {error&&<p role="alert" className="rounded-xl bg-rose-50 text-rose-700 p-3">{error}</p>}
 {loading?<p>Loading movies…</p>:<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{results.map(m=><article key={m.id} className="bg-white border rounded-2xl overflow-hidden">{m.poster_path?<img loading="lazy" alt={m.title+' poster'} src={'https://image.tmdb.org/t/p/w342'+m.poster_path} className="w-full aspect-[2/3] object-cover"/>:<div className="aspect-[2/3] bg-slate-200 flex items-center justify-center text-sm">No poster</div>}<div className="p-3"><h3 className="font-bold text-sm">{m.title}</h3><p className="text-xs text-slate-500">{m.release_date?.slice(0,4)||'Unknown year'} · ★ {m.vote_average?.toFixed(1)||'—'}</p><div className="flex gap-2 mt-3"><button onClick={()=>openTrailer(m.id)} className="bg-indigo-700 text-white rounded-xl p-2 text-xs flex-1">Trailer</button><button onClick={()=>toggle(m.id)} aria-label="Toggle favorite" className="border rounded-xl px-3">{favorites.includes(m.id)?'♥':'♡'}</button></div><p className="text-xs text-slate-500 mt-2">Full movie playback not available from TMDb</p></div></article>)}</div>}
 {apiKey&&total>20&&<div className="flex items-center justify-center gap-4"><button disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">Previous</button><span>Page {page} / {Math.min(500,Math.ceil(total/20))}</span><button disabled={page>=Math.min(500,Math.ceil(total/20))||loading} onClick={()=>setPage(v=>v+1)} className="border rounded-xl px-4 py-2 disabled:opacity-40">Next</button></div>}
 <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Authorized in-app movies</h3><p className="text-sm text-slate-500">Only independently identified, legally shareable films appear below. Availability depends on the source.</p><div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">{APPROVED_MOVIES.map(m=><article key={m.id} className="border rounded-xl p-3"><h4 className="font-semibold">{m.title}</h4><p className="text-xs text-slate-500">{m.year} · {m.quality}</p><button onClick={()=>setSelected(m)} className="mt-2 bg-indigo-700 text-white rounded-lg px-3 py-2">Watch film</button></article>)}</div></div>
 {trailer&&<div role="dialog" aria-modal="true" aria-label="Movie trailer" className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-4 w-full max-w-4xl"><button onClick={()=>setTrailer(null)} className="mb-3 rounded-xl bg-slate-100 px-4 py-2">Close trailer</button><iframe title="Movie trailer" src={'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(trailer)} allow="autoplay; fullscreen; encrypted-media" allowFullScreen className="w-full aspect-video bg-black"/></div></div>}
 {selected&&<div role="dialog" aria-modal="true" aria-label={selected.title} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-4 w-full max-w-4xl"><button onClick={()=>setSelected(null)} className="mb-3 rounded-xl bg-slate-100 px-4 py-2">Close movie</button><h3 className="font-bold mb-2">{selected.title}</h3>{selected.provider==='commons'?<video controls playsInline preload="metadata" className="w-full aspect-video bg-black" src={'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(selected.videoId)}/>:<iframe title={selected.title} src={'https://player.vimeo.com/video/'+encodeURIComponent(selected.videoId)} allow="autoplay; fullscreen" allowFullScreen className="w-full aspect-video bg-black"/>}<p className="text-xs text-slate-500 mt-2">{selected.rightsNote}</p></div></div>}
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
 const content=<React.Fragment key={`${tab}-${profile.id}`}>{tab==='medical'?<MedicalLog profile={profile}/>:tab==='history'?<History profile={profile}/>:tab==='quiz'?<DailyIslamicQuiz/>:tab==='features'?<FamilyFeatures profile={profile}/>:tab==='tv'?<LiveTV/>:tab==='movies'?<Movies/>:tab==='settings'?<FamilySettings profile={profile} onProfilesChanged={refreshProfiles}/>:<Dashboard profile={profile} onNavigateToRegistry={()=>setTab('medical')}/>}</React.Fragment>;
 return <div className="min-h-screen transition-colors duration-700" style={{backgroundColor:dark?"#0f172a":themeMode==='light'?"#f8fafc":dailyTheme.page}}><Sidebar activeTab={tab} setActiveTab={setTab}/><div className="md:ml-64"><header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/70 px-4 md:px-8 py-3 shadow-sm" style={{backgroundColor:dark?"#1e293b":themeMode==='light'?"#ffffff":dailyTheme.header}}><div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2"><div className="flex items-center justify-between gap-3"><div><h1 className={'font-bold text-xl '+(dark?'text-white':'text-slate-800')}>{tab==='medical'?tr('Health log','மருத்துவ பதிவுகள்'):tab==='quiz'?'தினசரி இஸ்லாமிய வினா':tab==='features'?tr('Family Care Center','குடும்ப பராமரிப்பு'):tab==='tv'?'Live TV':tab==='movies'?'Movies':tab==='settings'?tr('Family settings','குடும்ப அமைப்புகள்'):tr('Dashboard','முகப்பு')}</h1><p className="text-[11px] text-gray-400 flex gap-1 items-center"><Heart size={11}/>Liya and Liyan family care</p></div><div className="flex gap-2"><CloudSync status={cloudStatus} user={cloudUser}/><InstallApp/></div></div><div className="flex flex-col gap-2"><div className="flex flex-wrap gap-2 items-center"><label className="sr-only" htmlFor="koala-language">Language</label><select id="koala-language" value={language} onChange={e=>updateLanguage(e.target.value as 'en'|'ta')} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="en">English</option><option value="ta">தமிழ்</option></select><label className="sr-only" htmlFor="koala-theme">Appearance</label><select id="koala-theme" value={themeMode} onChange={e=>updateMode(e.target.value as 'daily'|'dark'|'light')} className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="daily">Daily theme</option><option value="light">Light</option><option value="dark">Dark</option></select></div><ProfileSwitcher profiles={profiles} selectedId={profile.id} onSelect={select}/></div></div></header><main className={"max-w-7xl mx-auto p-4 md:p-8 pb-28 space-y-5 "+(dark?"koala-dark":"")}>{tab==='dashboard'&&<section className="mb-5 rounded-[2rem] border border-white/80 px-6 py-8 md:px-10 md:py-10 shadow-[0_16px_45px_rgba(15,23,42,0.04)] relative overflow-hidden" style={{background:dailyTheme.hero}}><p className="inline-flex rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-extrabold tracking-widest uppercase text-emerald-700">Koala Family • Health companion</p><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 mt-4">{tr("Assalamu Alaikum! 🌿","அஸ்ஸலாமு அலைக்கும்! 🌿")}</h2><p className="text-sm md:text-base text-slate-600 mt-3 max-w-xl">{tr("Your family’s health, care and precious moments — all in one place.","உங்கள் குடும்பத்தின் ஆரோக்கியம், பராமரிப்பு மற்றும் இனிய நினைவுகள் ஒரே இடத்தில்.")}</p><div className="flex flex-wrap gap-3 mt-6"><button onClick={()=>setTab('medical')} className="text-white rounded-2xl px-5 py-3 text-sm font-bold shadow-md transition hover:scale-[1.02]" style={{backgroundColor:dailyTheme.accent}}>{tr("+ Add health record","+ மருத்துவ பதிவு")}</button><button onClick={()=>setTab('history')} className="bg-white/90 text-emerald-800 rounded-2xl px-5 py-3 text-sm font-bold border border-emerald-100 shadow-sm hover:bg-white transition">{tr("View history","பதிவுகள் வரலாறு")}</button></div></section>}{content}</main></div></div>;
};
export default App;
