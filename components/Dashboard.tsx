import React,{useCallback,useEffect,useMemo,useState} from 'react';
import { Activity,Baby,Cake,Calendar,CalendarHeart,Heart,Hourglass,Lightbulb,Loader2,Moon,PartyPopper,Plus,RefreshCw,Ruler,Scale,Syringe,Thermometer,TimerReset,Utensils } from 'lucide-react';
import { DailyFamilyInsight,MedicalRecord,Medicine,Profile,ProfileKind,RecordType } from '../types';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { formatDate,getAge,getLifeStats,LifeStats,localDateString } from '../services/date';
interface Props{profile:Profile;onNavigateToRegistry:()=>void;}
interface TimeParts{days:number;hours:number;minutes:number;seconds:number;}
// 20 x 19 combinations = 380 distinct messages per parent, covering all 365 days.
const adultDailyQuotes:Record<string,{location:string;heading:string;first:string[];second:string[]}>= {
  "sumaiya": {
    "location": "இந்தியா",
    "heading": "அம்மாவுக்கான இன்றைய சிந்தனை",
    "first": [
      "இன்னைக்கு கொஞ்ச நேரம் உங்களுக்காகவும் ஒதுக்கிக்கோங்க.",
      "நீங்க செய்யுற சின்னச் சின்ன விஷயங்களும் குடும்பத்துக்கு ரொம்ப முக்கியம்.",
      "குழந்தைகளோட சிரிச்சுப் பேசுற நேரம் எப்பவும் அழகானது.",
      "எல்லா வேலையையும் ஒரே நாளில் முடிக்கணும்னு நினைக்காதீங்க.",
      "இன்னைக்கு மனசுக்கு பிடிச்ச ஒரு விஷயத்தைச் செய்யுங்க.",
      "சோர்வா இருந்தா கொஞ்சம் ஓய்வு எடுத்துக்கோங்க.",
      "உங்க அன்பை குழந்தைகள் தினமும் உணருறாங்க.",
      "வீட்டில் சின்னச் சின்ன சந்தோஷங்களைக் கவனிங்க.",
      "உங்களோட முயற்சியை நீங்களே பாராட்டிக்கோங்க.",
      "குழந்தைகள் பேசும்போது நிதானமா கேட்டுப் பாருங்க.",
      "இன்னைக்கு ஒரு நல்ல நினைவை உருவாக்குங்க.",
      "சின்ன முன்னேற்றத்தைக்கூட சந்தோஷமா கொண்டாடுங்க.",
      "உங்களுக்கும் ஆசைகளும் கனவுகளும் இருக்கு; அதை மறக்காதீங்க.",
      "குடும்பத்தோட சேர்ந்து சிரிக்க ஒரு காரணம் தேடுங்க.",
      "எதுவும் சரியா நடக்காத நாளிலும் உங்களை நீங்களே குறை சொல்லாதீங்க.",
      "இன்னைக்கு கொஞ்ச நேரம் அமைதியா உட்காருங்க.",
      "உங்க உடம்பையும் மனசையும் கவனிச்சுக்கோங்க.",
      "ஒரு அன்பான வார்த்தை நாளையே அழகாக்கிடும்.",
      "குழந்தைகளோட விளையாட கொஞ்ச நேரம் ஒதுக்குங்க.",
      "உங்களுக்கு உதவி தேவைப்பட்டா தயங்காம கேளுங்க."
    ],
    "second": [
      "ஒரு சின்ன ஓய்வுகூட மனசுக்கு நல்ல மாற்றம் தரும்.",
      "உங்க அன்புதான் வீட்டுக்கு ஒரு தனி அழகு.",
      "நீங்க சந்தோஷமா இருக்கிறதும் முக்கியம்தான்.",
      "ஒவ்வொரு நாளும் புதுசா ஆரம்பிக்கலாம்.",
      "சின்னச் சின்ன தருணங்கள்தான் நல்ல நினைவுகளா மாறும்.",
      "அவசரப்படாம உங்க வேகத்திலேயே போங்க.",
      "குழந்தைகளுக்கு உங்க நேரமும் கவனமும் ரொம்பப் பிடிக்கும்.",
      "இன்னைக்கு நடந்த ஒரு நல்ல விஷயத்தை நினைச்சுப் பாருங்க.",
      "உங்களைப் பார்த்துக்கிறதும் அன்பின் ஒரு பகுதிதான்.",
      "கொஞ்சம் சிரிச்சுப் பேசினாலே மனசு லேசாகும்.",
      "உங்க முயற்சி வீணாகப் போகாது.",
      "எல்லாமே சரியா இருக்கணும்னு அவசியமில்லை.",
      "சின்ன உதவியைக்கூட ஏத்துக்கிறது நல்லதுதான்.",
      "நிதானமா இருந்தா பல விஷயங்கள் சுலபமாகும்.",
      "உங்க குடும்பத்துக்கு நீங்க ரொம்ப முக்கியமானவர்.",
      "ஒரு இனிய வார்த்தை பெரிய சந்தோஷம் தரலாம்.",
      "இன்னைக்கு உங்களுக்குப் பிடிச்ச ஒரு பாட்டைக் கேளுங்க.",
      "குடும்பத்தோட செலவிடுற நேரம் எப்பவும் மதிப்பானது.",
      "நாளைக்கு இன்னொரு நல்ல வாய்ப்பு இருக்கு."
    ]
  },
  "wajeethu-ali": {
    "location": "மலேசியா",
    "heading": "அப்பாவுக்கான இன்றைய சிந்தனை",
    "first": [
      "இன்னைக்கு குடும்பத்தோட கொஞ்ச நேரம் மனசுவிட்டுப் பேசுங்க.",
      "வேலை எவ்வளவு இருந்தாலும் உங்க உடம்பைக் கவனிச்சுக்கோங்க.",
      "குழந்தைகளோட ஒரு சின்ன அழைப்புகூட பெரிய சந்தோஷம் தரும்.",
      "இன்னைக்கு உங்களுக்காகவும் கொஞ்ச நேரம் ஒதுக்குங்க.",
      "நீங்க எடுக்குற ஒவ்வொரு முயற்சியும் முக்கியமானது.",
      "குடும்பத்துக்கு உங்க அன்பைச் சொல்லத் தயங்காதீங்க.",
      "சோர்வா இருந்தா கொஞ்சம் ஓய்வெடுத்துக்கோங்க.",
      "இன்னைக்கு நடந்த ஒரு நல்ல விஷயத்தை நினைச்சுப் பாருங்க.",
      "குழந்தைகள் சொல்லுற சின்ன விஷயங்களையும் ஆர்வமா கேளுங்க.",
      "வேலை முடிஞ்சதும் மனசுக்கு ஓய்வு கொடுங்க.",
      "உங்க கனவுகளுக்காக நிதானமா முன்னேறுங்க.",
      "இன்னைக்கு குடும்பத்துக்கு ஒரு அன்பான செய்தி அனுப்புங்க.",
      "சின்ன வெற்றியைக்கூட சந்தோஷமா கொண்டாடுங்க.",
      "உங்களுக்கு பிடிச்ச விஷயத்துக்கும் நேரம் ஒதுக்குங்க.",
      "குடும்பத்தோட பழைய நல்ல நினைவுகளை நினைச்சுப் பாருங்க.",
      "எல்லா பொறுப்பையும் தனியா சுமக்க வேண்டியதில்லை.",
      "உங்க முயற்சியை நீங்களே பாராட்டிக்கோங்க.",
      "குழந்தைகளுக்கு ஒரு குட்டிக் கதை சொல்லுங்க.",
      "இன்னைக்கு அவசரப்படாம ஒரு விஷயத்தைச் செய்து பாருங்க.",
      "தூரத்தில் இருந்தாலும் அன்பை வெளிப்படுத்த நிறைய வழிகள் இருக்கு."
    ],
    "second": [
      "உங்க குரலைக் கேட்பதே குழந்தைகளுக்கு சந்தோஷம்.",
      "சின்னச் சின்ன உரையாடல்கள்தான் உறவை இன்னும் நெருக்கமாக்கும்.",
      "உங்க நலனும் குடும்பத்துக்கு ரொம்ப முக்கியம்.",
      "ஒவ்வொரு நாளும் புதுசா தொடங்கலாம்.",
      "அன்பைச் சொல்ல பெரிய வார்த்தைகள் தேவையில்லை.",
      "கொஞ்சம் ஓய்வு எடுத்தா நாளை புத்துணர்ச்சியா இருக்கும்.",
      "உங்க நேரம்தான் குடும்பத்துக்கு ஒரு அழகான பரிசு.",
      "சின்ன முயற்சிகளும் நாளடைவில் நல்ல பலன் தரும்.",
      "உங்க அக்கறை எப்பவும் குடும்பத்துக்கு தெரியும்.",
      "இன்னைக்கு ஒரு நல்ல நினைவை உருவாக்கலாம்.",
      "நிதானமா முன்னேறினாலும் அது முன்னேற்றம்தான்.",
      "உங்களை நீங்களே அதிகமா வருத்திக்காதீங்க.",
      "ஒரு சிரிப்பும் ஒரு அன்பான வார்த்தையும் போதும்.",
      "குடும்பத்தோட பேசுற நேரத்தை ரசிங்க.",
      "உங்க உழைப்போட சேர்த்து ஓய்வுக்கும் இடம் கொடுங்க.",
      "சின்ன சந்தோஷங்களையும் தவறவிடாதீங்க.",
      "குழந்தைகளுக்கு நீங்க சொல்ற கதைகள் பிடிக்கும்.",
      "நாளைக்கு இன்னொரு நல்ல வாய்ப்பு காத்திருக்கு.",
      "உங்களோட அன்பு எப்பவும் மதிப்பானது."
    ]
  }
};
const getAdultDailyQuote=(profileId:string,date:string)=>{
 const set=adultDailyQuotes[profileId];if(!set)return null;
 const [year,month,day]=date.split('-').map(Number);
 const dayOfYear=Math.floor((Date.UTC(year,month-1,day)-Date.UTC(year,0,1))/86400000);
 // Coprime step keeps each pair unique across the entire year.
 const index=dayOfYear;
 const first=set.first[index%set.first.length];
 const second=set.second[Math.floor(index/set.first.length)%set.second.length];
 return {...set,quote:`${first} ${second}`};
};
const TimeGrid:React.FC<{parts:TimeParts;dark?:boolean}>=({parts,dark=false})=><div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-2 w-full min-w-0">{[['DAYS',parts.days.toLocaleString()],['HRS',String(parts.hours).padStart(2,'0')],['MIN',String(parts.minutes).padStart(2,'0')],['SEC',String(parts.seconds).padStart(2,'0')]].map(([label,value])=><div key={label} className={`min-w-0 rounded-lg px-0.5 py-1 text-center ${dark?'bg-white/15':'bg-emerald-50'}`}><p className="text-[clamp(10px,2.8vw,15px)] font-bold tabular-nums truncate leading-tight">{value}</p><p className={`text-[8px] font-semibold mt-0.5 ${dark?'text-emerald-100':'text-slate-500'}`}>{label}</p></div>)}</div>;
const LifeMoments:React.FC<{profile:Profile;life:LifeStats;live:{birthday:TimeParts;elapsed:TimeParts}}>=({profile,life,live})=><section className="min-w-0"><h3 className="text-base font-bold text-gray-900 mb-2">Life moments</h3><div className="grid grid-cols-2 gap-2"><article className="min-w-0 bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><div className="flex gap-1 items-center text-xs font-semibold text-slate-600"><PartyPopper size={15} className="text-rose-500 shrink-0"/>Next birthday</div>{life.daysToBirthday===0?<p className="font-bold text-emerald-700 mt-2">Birthday today!</p>:<TimeGrid parts={live.birthday}/>}<p className="text-[10px] text-slate-500 mt-2 truncate">{formatDate(life.nextBirthday)}</p></article><article className="min-w-0 bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><div className="flex gap-1 items-center text-xs font-semibold text-slate-600"><TimerReset size={15} className="text-sky-600 shrink-0"/>Time since birth</div><TimeGrid parts={live.elapsed}/><p className="text-[10px] text-slate-500 mt-2">Live lifetime clock</p></article><article className="min-w-0 bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><div className="flex gap-1 items-center text-xs font-semibold text-slate-600"><CalendarHeart size={15} className="text-emerald-600 shrink-0"/>Completed weeks</div><p className="text-2xl font-bold text-slate-800 mt-2 tabular-nums">{life.totalWeeks.toLocaleString()}</p><p className="text-[10px] text-slate-500 mt-1">{life.totalDays.toLocaleString()} total days</p></article><article className="min-w-0 bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><div className="flex gap-1 items-center text-xs font-semibold text-slate-600"><Hourglass size={15} className="text-amber-600 shrink-0"/>Exact age today</div><p className="text-xl font-bold text-slate-800 mt-2 tabular-nums">{life.years}y {life.months}m {life.days}d</p><p className="text-[10px] text-slate-500 mt-1 truncate">From {formatDate(profile.birthDate!)}</p></article></div></section>;
export const Dashboard:React.FC<Props>=({profile,onNavigateToRegistry})=>{
 const [records,setRecords]=useState<MedicalRecord[]>([]);const [medicines,setMedicines]=useState<Medicine[]>([]);const [insight,setInsight]=useState<(DailyFamilyInsight&{aiError?:string})|null>(null);const [insightLoading,setInsightLoading]=useState(false);const [now,setNow]=useState(()=>new Date());const today=localDateString(now);
 const load=useCallback(()=>{StorageService.getRecords(profile.id).then(setRecords);StorageService.getMedicines(profile.id).then(setMedicines);},[profile.id]);
 const loadInsight=useCallback(async(force=false)=>{if(profile.kind!==ProfileKind.CHILD)return;setInsight(GeminiService.instantInsight(profile));setInsightLoading(true);try{setInsight(await GeminiService.getDailyFamilyInsight(profile,force));}catch(error){console.warn('Daily advice refresh failed',error);}finally{setInsightLoading(false);}},[profile,today]);
 useEffect(()=>{load();window.addEventListener('koalaDataChanged',load);return()=>window.removeEventListener('koalaDataChanged',load);},[load]);
 useEffect(()=>{setInsight(GeminiService.instantInsight(profile));loadInsight();},[loadInsight]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);const refresh=()=>setNow(new Date());document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh);};},[]);
 const latest=(type:RecordType)=>records.find(r=>r.type===type);
 const upcoming=records.filter(r=>(r.type===RecordType.APPOINTMENT||r.type===RecordType.VACCINATION)&&r.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
 const recent=records.slice(0,3);const counts=useMemo(()=>({feeds:records.filter(r=>r.date===today&&r.type===RecordType.FEEDING).length,sleep:records.filter(r=>r.date===today&&r.type===RecordType.SLEEP).length,diapers:records.filter(r=>r.date===today&&r.type===RecordType.DIAPER).length}),[records,today]);
 const cards=[{label:'Weight',record:latest(RecordType.WEIGHT),icon:Scale,color:'text-emerald-600 bg-emerald-50'},{label:'Height',record:latest(RecordType.HEIGHT),icon:Ruler,color:'text-sky-600 bg-sky-50'},{label:'Temperature',record:latest(RecordType.TEMPERATURE),icon:Thermometer,color:'text-rose-600 bg-rose-50'}];const life=getLifeStats(profile.birthDate,now);const adultQuote=getAdultDailyQuote(profile.id,today);
 const live=useMemo(()=>{if(!profile.birthDate||!life)return null;const birth=new Date(`${profile.birthDate}T00:00:00`);const birthday=new Date(`${life.nextBirthday}T00:00:00`);const remaining=Math.max(0,birthday.getTime()-now.getTime());const elapsed=Math.max(0,now.getTime()-birth.getTime());const split=(value:number)=>{const totalSeconds=Math.floor(value/1000);return {days:Math.floor(totalSeconds/86400),hours:Math.floor(totalSeconds%86400/3600),minutes:Math.floor(totalSeconds%3600/60),seconds:totalSeconds%60};};return {birthday:split(remaining),elapsed:split(elapsed)};},[profile.birthDate,life?.nextBirthday,now]);
 return <div className={`grid gap-2 md:gap-3 animate-fade-in dashboard-fit ${profile.kind===ProfileKind.CHILD?'dashboard-child':'dashboard-adult'} ${profile.id==='liyan'?'dashboard-liyan':''}`}>
  <section className="bg-white border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3">{profile.photo?<img src={profile.photo} alt={`${profile.name} profile`} className="w-16 h-16 rounded-2xl object-cover border border-emerald-100"/>:<div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{background:profile.color}}>{profile.name.charAt(0)}</div>}<div><h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2><p className="text-sm text-gray-500 mt-1">{getAge(profile.birthDate)}{profile.birthDate?` • Born ${formatDate(profile.birthDate)}`:''}</p>{profile.allergies&&<p className="mt-1 text-xs font-semibold text-rose-600">Allergies: {profile.allergies}</p>}</div></div><button onClick={onNavigateToRegistry} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"><Plus size={17}/>Add health entry</button></section>
  <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">{[{title:"Medicines",value:medicines.length,sub:"configured",tone:"bg-rose-50 text-rose-700"},{title:"Health records",value:records.length,sub:"total entries",tone:"bg-sky-50 text-sky-700"},{title:"Upcoming care",value:upcoming.length,sub:"scheduled",tone:"bg-emerald-50 text-emerald-700"},{title:"Recent activity",value:recent.length,sub:"latest entries",tone:"bg-violet-50 text-violet-700"}].map(card=><article key={card.title} className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><p className="text-[11px] font-semibold text-slate-500">{card.title}</p><p className="text-xl font-bold text-slate-800 mt-1">{card.value}</p><span className={`inline-block mt-1 px-2 py-0.5 rounded-xl text-[11px] ${card.tone}`}>{card.sub}</span></article>)}</section>
  {medicines.length>0&&<section className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm"><h3 className="font-bold text-slate-800 mb-2">Medicine schedule</h3><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-40 overflow-y-auto">{medicines.map(m=><article key={m.id} className="bg-rose-50/60 rounded-2xl p-2.5 flex justify-between gap-2"><div><p className="font-bold text-slate-800">{m.name}</p><p className="text-xs text-slate-500 mt-1">{m.dosage||"Dosage not entered"}</p></div><div className="text-xs text-rose-700 font-semibold text-right">{m.reminderTimes.length?m.reminderTimes.join(", "):"No reminder set"}</div></article>)}</div><p className="text-xs text-slate-400 mt-3">Check your prescription for dosing instructions.</p></section>}
  {life&&live&&<LifeMoments profile={profile} life={life} live={live}/>}
  {adultQuote&&<section className="bg-gradient-to-br from-violet-50 to-rose-50 border border-violet-100 rounded-2xl p-6"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-violet-700"><Heart size={18}/><h3 className="font-bold">{adultQuote.heading}</h3></div><span className="text-[10px] font-bold uppercase tracking-wide text-violet-500 bg-white/70 border border-violet-100 rounded-full px-3 py-1">{adultQuote.location}</span></div><p className="mt-4 text-xl font-semibold leading-relaxed text-gray-800">“{adultQuote.quote}”</p><p className="mt-4 text-xs text-gray-500">{profile.name} குடும்பத்திற்கான தினசரி ஊக்கச் செய்தி • ஒவ்வொரு நாளும் மாறும்</p></section>}
  {profile.kind===ProfileKind.CHILD&&<section className="bg-white border border-emerald-100 rounded-2xl overflow-hidden"><div className="px-6 py-4 border-b flex items-center justify-between"><div><h3 className="font-bold">இன்றைய குறிப்பு - {profile.name}</h3><p className="text-xs text-gray-400 mt-1">அன்பான தினசரிச் செய்தியும் வயதிற்கு ஏற்ற பொதுவான வழிகாட்டலும்</p></div><button onClick={()=>loadInsight(true)} disabled={insightLoading} title="புதிய தினசரிக் குறிப்பை உருவாக்கவும்" className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-40">{insightLoading?<Loader2 size={18} className="animate-spin"/>:<RefreshCw size={18}/>}</button></div>{insight?<div className="grid md:grid-cols-2"><div className="p-6 md:border-r border-emerald-100"><div className="flex items-center gap-2 text-rose-600"><Heart size={18}/><h4 className="text-xs font-bold">{profile.name} அம்மாவிடம் சொல்வது</h4></div><p className="mt-4 text-lg font-semibold leading-relaxed text-gray-800">“{insight.babyMessage}”</p></div><div className="p-6 bg-amber-50/50"><div className="flex items-center gap-2 text-amber-700"><Lightbulb size={18}/><h4 className="text-xs font-bold">அம்மாவுக்கான ஆலோசனை</h4></div><p className="mt-4 text-sm leading-relaxed text-gray-700">{insight.momAdvice}</p><p className="text-[10px] text-gray-400 mt-4">பொதுவான வழிகாட்டல் மட்டும் {insight.source==='fallback'?'• தற்காலிக மாற்றுக் குறிப்பு':'• AI உருவாக்கியது'}{insight.aiError&&<span className="block mt-1 text-rose-600 break-all">AI error: {insight.aiError}</span>}</p></div></div>:<div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-400"><Loader2 size={18} className="animate-spin"/>இன்றைய குறிப்பைத் தயாரிக்கிறது...</div>}</section>}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{cards.map(({label,record,icon:Icon,color})=><div key={label} className="bg-white border border-emerald-100 rounded-2xl p-5"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}><Icon size={20}/></div><p className="text-xs font-bold uppercase text-gray-400 mt-4">Latest {label}</p><p className="text-2xl font-bold mt-1">{record?.value!==undefined?`${record.value} ${record.unit||''}`:'Not recorded'}</p>{record&&<p className="text-xs text-gray-400 mt-1">{formatDate(record.date)}</p>}</div>)}</div>
  {profile.id==='liyan'&&<section><h3 className="text-lg font-bold mb-3">Today for Liyan</h3><div className="grid grid-cols-3 gap-3">{[[Utensils,'Feeds',counts.feeds],[Moon,'Sleep logs',counts.sleep],[Baby,'Diapers',counts.diapers]].map(([Icon,label,value]:any)=><div key={label} className="bg-white border rounded-2xl p-4 text-center"><Icon className="mx-auto text-sky-600" size={20}/><p className="text-2xl font-bold mt-2">{value}</p><p className="text-xs text-gray-400">{label}</p></div>)}</div></section>}
  <div className="grid lg:grid-cols-2 gap-6"><section className="bg-white border rounded-2xl p-6"><h3 className="font-bold flex items-center gap-2"><Calendar size={18}/>Upcoming care</h3><div className="mt-4 space-y-3">{upcoming.length?upcoming.map(r=><div key={r.id} className="flex items-center gap-3 p-3 bg-emerald-50/40 rounded-2xl"><Syringe size={17} className="text-rose-500"/><div><p className="font-semibold text-sm">{r.title}</p><p className="text-xs text-gray-400">{formatDate(r.date)}{r.location?` • ${r.location}`:''}</p></div></div>):<p className="text-sm text-gray-400 py-5">No upcoming appointments or vaccines.</p>}</div></section><section className="bg-white border rounded-2xl p-6"><h3 className="font-bold flex items-center gap-2"><Activity size={18}/>Recent activity</h3><div className="mt-4 divide-y">{recent.length?recent.map(r=><div key={r.id} className="py-3 flex justify-between gap-3"><div><p className="font-semibold text-sm">{r.title}</p><p className="text-xs text-gray-400">{r.type}</p></div><span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(r.date)}</span></div>):<p className="text-sm text-gray-400 py-5">No records yet.</p>}</div></section></div>
  <p className="text-xs text-gray-400 flex gap-2"><Baby size={14}/>This tracker supports record keeping and does not replace advice from your child’s clinician.</p>
 </div>;
};
