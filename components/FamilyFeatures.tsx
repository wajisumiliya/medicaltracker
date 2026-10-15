import React,{useEffect,useMemo,useState} from 'react';
import {Download,Plus,Trash2} from 'lucide-react';
import {Profile,MedicalRecord,RecordType} from '../types';
import {StorageService} from '../services/storage';
import {getAge,localDateString} from '../services/date';
type Extra={id:string;profileId:string;category:string;date:string;title:string;details:string;amount?:number};
const KEY='koala_family_care_extra_v1';
const categories=[
 ['Growth','📈','Record weight, height and head circumference. Compare growth with your clinician using WHO charts.'],
 ['Vaccinations','💉','Log doses and due dates; confirm Malaysia schedule with your clinic.'],
 ['Feeding & Sleep','🍼','Track feeds, naps and diaper changes.'],
 ['Medicines','💊','Track prescribed medicine and reminders.'],
 ['Milestones','🌱','Record first smiles, rolling, talking and walking.'],
 ['Calendar','📅','Appointments, follow-ups and family health events.'],
 ['Daily Du’a','🤲','Daily Islamic remembrance and family gratitude.'],
 ['Memories','📸','Record precious moments and milestones.'],
 ['Emergency Card','🆘','Allergies and emergency contacts for quick reference.'],
 ['Health Summary','📊','Review recent health entries and trends.'],
 ['Expenses','💳','Track clinic, hospital and pharmacy spending.'],
 ['Offline Records','📱','Access locally saved records even without internet.'],
 ['Family Updates','👨‍👩‍👧‍👦','Review the latest family health updates.'],
 ['Daily Challenge','🎨','Age-appropriate play and learning activities.'],
 ['Health Report','📄','Export a printable family health summary.']
] as const;
const read=():Extra[]=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const days=['சுப்ஹானல்லாஹ்','அல்ஹம்துலில்லாஹ்','அல்லாஹு அக்பர்','பிஸ்மில்லாஹ்','அஸ்தக்ஃபிருல்லாஹ்','லா இலாஹ இல்லல்லாஹ்','அல்லாஹும்ம சல்லி அலா முஹம்மத்'];
const challenges=['ஒரு குட்டிக் கதை படிங்க','சேர்ந்து பாட்டு பாடுங்க','வண்ணங்களைப் பார்த்துப் பேசுங்க','பாதுகாப்பான விளையாட்டு நேரம் ஒதுக்குங்க','சின்னச் சின்ன அசைவுகளை ஊக்கப்படுத்துங்க','குடும்பத்துடன் சிரிச்சுப் பேசுங்க','இன்னைக்கு ஒரு நல்ல நினைவைப் பதிவு செய்யுங்க'];
const escapeHtml=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export const FamilyFeatures:React.FC<{profile:Profile}>=({profile})=>{
 const [items,setItems]=useState<Extra[]>(read);
 const [records,setRecords]=useState<MedicalRecord[]>([]);
 const [active,setActive]=useState<string>('Growth');
 const [title,setTitle]=useState('');
 const [details,setDetails]=useState('');
 const [date,setDate]=useState(localDateString());
 const [amount,setAmount]=useState('');
 useEffect(()=>{StorageService.getRecords(profile.id).then(setRecords)},[profile.id]);
 const own=useMemo(()=>items.filter(x=>x.profileId===profile.id&&x.category===active).sort((a,b)=>b.date.localeCompare(a.date)),[items,profile.id,active]);
 const medical=records.filter(r=>active==='Growth'?[RecordType.WEIGHT,RecordType.HEIGHT,RecordType.HEAD_CIRCUMFERENCE].includes(r.type):active==='Vaccinations'?r.type===RecordType.VACCINATION:active==='Feeding & Sleep'?[RecordType.FEEDING,RecordType.SLEEP,RecordType.DIAPER].includes(r.type):active==='Medicines'?r.type===RecordType.MEDICINE:active==='Calendar'?r.type===RecordType.APPOINTMENT:true);
 const save=()=>{if(!title.trim())return;const next=[{id:StorageService.generateId(),profileId:profile.id,category:active,date,title:title.trim(),details:details.trim(),amount:active==='Expenses'?Number(amount)||0:undefined},...items];localStorage.setItem(KEY,JSON.stringify(next));setItems(next);setTitle('');setDetails('');setAmount('');};
 const remove=(id:string)=>{const next=items.filter(x=>x.id!==id);localStorage.setItem(KEY,JSON.stringify(next));setItems(next)};
 const printReport=()=>{const w=window.open('','_blank');if(!w)return;const all=items.filter(x=>x.profileId===profile.id);const rows=[...records.map(r=>({date:r.date,type:r.type,title:r.title,details:r.details})),...all.map(r=>({date:r.date,type:r.category,title:r.title,details:r.details}))].sort((a,b)=>b.date.localeCompare(a.date));w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Family Health Report</title><style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>Koala Family Health Report</h1><p>'+escapeHtml(profile.name)+' — '+escapeHtml(getAge(profile.birthDate))+'</p><p>Allergies: '+escapeHtml(profile.allergies||'Not recorded')+'</p><table><tr><th>Date</th><th>Category</th><th>Title</th><th>Details</th></tr>'+rows.map(r=>'<tr><td>'+escapeHtml(r.date)+'</td><td>'+escapeHtml(r.type)+'</td><td>'+escapeHtml(r.title)+'</td><td>'+escapeHtml(r.details)+'</td></tr>').join('')+'</table></body></html>');w.document.close();w.print();};
 const [year,month,dayOfMonth]=date.split('-').map(Number);
 const day=Math.floor(Date.UTC(year,month-1,dayOfMonth)/86400000);
 const dayIndex=((day%7)+7)%7;
 return <div className="space-y-5"><div className="rounded-3xl bg-white p-5 border border-emerald-100"><h2 className="text-xl font-bold text-slate-800">Family Care Center</h2><p className="text-sm text-slate-500 mt-1">{profile.name} · {getAge(profile.birthDate)} · 15 family-care tools</p><p className="text-xs text-amber-700 mt-2">Additional care notes are saved on this device. Export regularly; they are not yet included in Firebase cloud sync or standard backups.</p></div>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">{categories.map(([name,emoji])=><button key={name} onClick={()=>setActive(name)} className={'text-left rounded-2xl border p-3 min-h-20 '+(active===name?'bg-emerald-100 border-emerald-400':'bg-white border-slate-100')}><span className="text-2xl">{emoji}</span><p className="text-xs font-semibold mt-2">{name}</p></button>)}</div>
 <section className="bg-white border border-slate-100 rounded-3xl p-4 md:p-6 space-y-4"><div><h3 className="font-bold text-lg">{active}</h3><p className="text-sm text-slate-500">{categories.find(c=>c[0]===active)?.[2]}</p></div>
 {active==='Daily Du’a'&&<div className="bg-teal-50 rounded-xl p-4"><p className="font-semibold text-teal-800">{days[dayIndex]}</p><p className="text-xs mt-2 text-teal-700">தினமும் குடும்பத்தோட சேர்ந்து அல்லாஹ்வை நினைவு கூருங்க.</p></div>}
 {active==='Daily Challenge'&&<div className="bg-rose-50 rounded-xl p-4 text-sm">{challenges[dayIndex]} — குழந்தையின் வயதுக்கும் பாதுகாப்புக்கும் ஏற்றபடி செய்யுங்க.</div>}
 {active==='Emergency Card'&&<div className="rounded-xl border p-4"><p className="font-semibold">{profile.name}</p><p className="text-sm">Age: {getAge(profile.birthDate)}</p><p className="text-sm">Allergies: {profile.allergies||'Not recorded'}</p><p className="text-xs text-rose-700 mt-2">Emergency contacts can be entered as a care note below. In an emergency contact local emergency services.</p></div>}
 {active==='Health Summary'&&<div className="rounded-xl bg-sky-50 p-4 text-sm"><p>Medical records: {records.length}</p><p>Last 30 days: {records.filter(r=>r.date>=localDateString(new Date(Date.now()-30*86400000))).length}</p><p>Latest record: {records[0]?.title||'None yet'}</p></div>}
 {active==='Expenses'&&<p className="font-bold text-lg">Total recorded: RM {items.filter(x=>x.profileId===profile.id&&x.category==='Expenses').reduce((sum,x)=>sum+(x.amount||0),0).toFixed(2)}</p>}
 {active==='Health Report'&&<button onClick={printReport} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm"><Download size={16}/>Print / Save PDF report</button>}
 {active==='Offline Records'&&<p className="text-sm bg-amber-50 p-3 rounded-xl">Medical records and care notes are stored locally. Full offline installation depends on browser caching and connectivity; cloud sync requires internet.</p>}
 {active==='Family Updates'&&<p className="text-sm bg-blue-50 p-3 rounded-xl">Recent medical records for this profile appear below. Live cross-device notifications are not yet enabled.</p>}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input aria-label="Care note title" placeholder="Title / event / note" value={title} onChange={e=>setTitle(e.target.value)} className="border rounded-xl p-3 text-sm"/><input aria-label="Date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded-xl p-3 text-sm"/><textarea aria-label="Care note details" placeholder="Details, time, next appointment, contact, or observations" value={details} onChange={e=>setDetails(e.target.value)} className="border rounded-xl p-3 text-sm sm:col-span-2" rows={2}/>{active==='Expenses'&&<input type="number" min="0" step="0.01" placeholder="Amount (RM)" value={amount} onChange={e=>setAmount(e.target.value)} className="border rounded-xl p-3 text-sm"/>}</div><button onClick={save} disabled={!title.trim()} className="flex gap-2 items-center bg-emerald-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-sm font-semibold"><Plus size={16}/>Save {active} note</button>
 <div className="space-y-2">{own.map(x=><div key={x.id} className="border rounded-xl p-3 flex justify-between gap-3"><div><p className="font-semibold text-sm">{x.title}</p><p className="text-xs text-slate-500">{x.date} {x.amount!==undefined?'· RM '+x.amount.toFixed(2):''}</p><p className="text-sm mt-1 whitespace-pre-wrap">{x.details}</p></div><button aria-label="Delete note" onClick={()=>remove(x.id)} className="text-rose-600 self-start"><Trash2 size={17}/></button></div>)}</div>
 {['Growth','Vaccinations','Feeding & Sleep','Medicines','Calendar','Health Summary','Family Updates'].includes(active)&&<div><h4 className="font-semibold text-sm mb-2">Existing medical records</h4>{medical.slice(0,15).map(r=><div key={r.id} className="border-b py-2 text-sm"><span className="text-slate-400">{r.date}</span> · {r.title} {r.value!==undefined?String(r.value)+' '+(r.unit||''):''}</div>)}{medical.length===0&&<p className="text-xs text-slate-500">No records yet. Add entries from Medical Records.</p>}</div>}
 </section></div>;
};
