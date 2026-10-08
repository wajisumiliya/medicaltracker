import React from 'react';
import { LayoutDashboard, Stethoscope, History, BookOpenCheck, Settings } from 'lucide-react';
interface Props{activeTab:string;setActiveTab:(tab:string)=>void;}
export const Sidebar:React.FC<Props>=({activeTab,setActiveTab})=>{
 const items=[['dashboard','Dashboard',LayoutDashboard],['medical','Health log',Stethoscope],['history','History',History],['quiz','தினசரி இஸ்லாமிய வினா',BookOpenCheck],['settings','Family settings',Settings]] as const;
 return <><aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex-col">
  <div className="px-6 py-7"><h1 className="text-xl font-bold text-gray-900 font-heading">Koala Family</h1><p className="text-xs text-gray-400 mt-1">Health tracker</p></div>
  <nav className="flex-1 px-3 space-y-1">{items.map(([id,label,Icon])=><button key={id} onClick={()=>setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${activeTab===id?'bg-rose-50 text-rose-700':'text-gray-500 hover:bg-gray-50'}`}><Icon size={19}/>{label}</button>)}</nav>
  <div className="p-5 text-[11px] text-gray-400 border-t">Private family records on this device</div>
 </aside>
 <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t flex justify-around py-2">{items.map(([id,label,Icon])=><button key={id} onClick={()=>setActiveTab(id)} title={label} className={`p-2 ${activeTab===id?'text-rose-600':'text-gray-400'}`}><Icon size={21}/></button>)}</nav></>;
};
