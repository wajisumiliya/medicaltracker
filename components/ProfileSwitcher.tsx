import React from 'react';
import { Check } from 'lucide-react';
import { Profile } from '../types';
import { getAge } from '../services/date';
interface Props { profiles:Profile[]; selectedId:string; onSelect:(id:string)=>void; }
export const ProfileSwitcher:React.FC<Props>=({profiles,selectedId,onSelect})=><div role="group" aria-label="Select family member" className="flex gap-2.5 overflow-x-auto pb-1 max-w-full koala-profile-switcher">
 {profiles.map(p=>{const selected=selectedId===p.id;return <button type="button" key={p.id} onClick={()=>onSelect(p.id)} aria-pressed={selected} className={`group shrink-0 min-w-fit px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 transition-all duration-200 ${selected?'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-200/60':'bg-white/85 text-slate-600 border-white hover:border-emerald-200 hover:bg-white shadow-sm'}`}>
 {p.photo?<img src={p.photo} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/60"/>:<span className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-extrabold ring-2 ring-white/60" style={{background:p.color}}>{p.name.charAt(0)}</span>}
 <span className="text-left"><span className="block text-sm font-extrabold leading-tight">{p.name}</span><span className={`block text-[11px] mt-1 ${selected?'text-emerald-50':'text-slate-400'}`}>{getAge(p.birthDate)}</span></span>
 {selected&&<Check size={15} className="ml-1 shrink-0" aria-hidden="true"/>}
 </button>})}
 </div>;
