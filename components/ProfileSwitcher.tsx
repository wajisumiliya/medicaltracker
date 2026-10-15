import React from 'react';
import { Profile } from '../types';
import { getAge } from '../services/date';
interface Props { profiles:Profile[]; selectedId:string; onSelect:(id:string)=>void; }
export const ProfileSwitcher:React.FC<Props>=({profiles,selectedId,onSelect})=><div className="flex gap-2 overflow-x-auto pb-1">
 {profiles.map(p=><button key={p.id} onClick={()=>onSelect(p.id)} className={`min-w-fit px-3 py-2 rounded-2xl border flex items-center gap-2 transition shadow-sm ${selectedId===p.id?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-600 border-emerald-100 hover:border-emerald-300'}`}>
  {p.photo?<img src={p.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-white/30"/>:<span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:p.color}}>{p.name.charAt(0)}</span>}<span className="text-sm font-bold">{p.name}</span><span className={`text-[10px] ${selectedId===p.id?'text-gray-300':'text-gray-400'}`}>{getAge(p.birthDate)}</span>
 </button>)}
</div>;
