import React,{useEffect,useState} from 'react';
import { Download,Share2,X } from 'lucide-react';

interface InstallPromptEvent extends Event { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}>; }

export const InstallApp:React.FC=()=>{
 const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);const [showIos,setShowIos]=useState(false);
 const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone===true;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 useEffect(()=>{const handler=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent);};window.addEventListener('beforeinstallprompt',handler);return()=>window.removeEventListener('beforeinstallprompt',handler);},[]);
 if(standalone||(!prompt&&!ios))return null;
 const install=async()=>{if(ios){setShowIos(true);return;}if(prompt){await prompt.prompt();await prompt.userChoice;setPrompt(null);}};
 return <><button onClick={install} className="border border-gray-200 bg-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap"><Download size={16}/>Install app</button>{showIos&&<div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={()=>setShowIos(false)}><div className="bg-white rounded-lg p-6 max-w-sm w-full" onClick={e=>e.stopPropagation()}><div className="flex justify-between items-start"><h2 className="text-lg font-bold">Install Koala Family</h2><button onClick={()=>setShowIos(false)} title="Close"><X size={20}/></button></div><p className="text-sm text-gray-600 mt-4">In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.</p><div className="mt-5 flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm font-semibold"><Share2 className="text-sky-600"/>Share → Add to Home Screen</div></div></div>}</>;
};
