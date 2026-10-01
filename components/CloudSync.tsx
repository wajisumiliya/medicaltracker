import React from 'react';
import { Cloud, CloudOff, Loader2, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { CloudService, CloudStatus } from '../services/cloud';
interface Props{status:CloudStatus;user:User|null;}
export const CloudSync:React.FC<Props>=({status,user})=>{
 if(user)return <button onClick={()=>CloudService.signOut()} title="Sign out of cloud sync" className={`border px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${status==='error'?'text-rose-600 bg-rose-50':'text-emerald-700 bg-emerald-50'}`}>{status==='connecting'?<Loader2 size={15} className="animate-spin"/>:<Cloud size={15}/>}<span className="hidden sm:inline">{status==='synced'?'Synced':'Cloud sync'}</span><LogOut size={13}/></button>;
 return <button onClick={async()=>{try{await CloudService.signIn();}catch(error:any){alert(error.message||'Cloud sign-in failed.');}}} className="border px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-white"><CloudOff size={15}/><span className="hidden sm:inline">Connect sync</span></button>;
};
