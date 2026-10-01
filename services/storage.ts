import { BackupData, DailyFamilyInsight, MedicalRecord, Medicine, Profile, ProfileKind, User } from '../types';
const RK='koala_records_v2', PK='koala_profiles_v2', MK='koala_medicines_v2', SK='koala_selected_profile_v2', UK='koala_current_session', IK='koala_global_profile_image', MIG='koala_v2_migrated', QK='koala_quota_error_ts', PIN='koala_pin_hash_v2';
const defaults:Profile[]=[
 {id:'liya',name:'Liya',kind:ProfileKind.CHILD,birthDate:'2023-09-22',sex:'female',color:'#e11d48',allergies:'',notes:''},
 {id:'liyan',name:'Liyan',kind:ProfileKind.CHILD,birthDate:'2026-05-14',sex:'male',color:'#0284c7',allergies:'',notes:''},
 {id:'sumaiya',name:'Sumaiya',kind:ProfileKind.ADULT,birthDate:'1998-06-09',sex:'female',color:'#059669',allergies:'',notes:'Mother and archived pregnancy records'},
 {id:'wajeethu-ali',name:'Wajeethu Ali',kind:ProfileKind.ADULT,birthDate:'1995-08-29',sex:'male',color:'#7c3aed',allergies:'',notes:'Father'}];
const read=<T,>(key:string,fallback:T):T=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback;}catch{return fallback;}};
const write=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));
const changed=()=>window.dispatchEvent(new CustomEvent('koalaDataChanged'));
const cloud=(detail:unknown)=>window.dispatchEvent(new CustomEvent('koalaCloudMutation',{detail}));
const insightKey=(profileId:string,date:string)=>`koala_daily_insight_tamil_v4_${profileId}_${date}`;
export const StorageService={
 initialize:()=>{if(!localStorage.getItem(PK))write(PK,defaults);else{const profiles=read<Profile[]>(PK,[]);const mom=profiles.find(profile=>profile.id==='sumaiya');if(mom){mom.birthDate='1998-06-09';mom.sex='female';}if(!profiles.some(profile=>profile.id==='wajeethu-ali'))profiles.push(defaults.find(profile=>profile.id==='wajeethu-ali')!);write(PK,profiles);}if(!localStorage.getItem(SK))localStorage.setItem(SK,'liyan');if(!localStorage.getItem(MIG)){const old=read<any[]>('koala_records_v1',[]);if(old.length&&!read<any[]>(RK,[]).length)write(RK,old.map(r=>({...r,profileId:'sumaiya',value:r.value===''||r.value===undefined?undefined:Number(r.value)})));const meds=read<any[]>('koala_medicine_config_v1',[]);if(meds.length&&!read<any[]>(MK,[]).length)write(MK,meds.map(m=>({id:m.id,profileId:'sumaiya',name:m.name,dosage:'',reason:'Migrated from pregnancy tracker',prescribingDoctor:'',startDate:'',reminderTimes:[]})));localStorage.setItem(MIG,new Date().toISOString());}},
 getUserData:():User|null=>{const u=read<User|null>(UK,null);if(u)u.profileImage=localStorage.getItem(IK)||undefined;return u;},getGlobalProfileImage:()=>localStorage.getItem(IK),
 saveProfileImage:(v:string)=>{localStorage.setItem(IK,v);window.dispatchEvent(new CustomEvent('koalaProfileUpdate',{detail:v}));},
 hasPin:()=>!!localStorage.getItem(PIN),
 hashPin:async(pin:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pin)))).map(x=>x.toString(16).padStart(2,'0')).join(''),
 login:async(name:string,pin:string)=>{if(name.trim().toLowerCase()!=='sumaiya')return false;const saved=localStorage.getItem(PIN);if(saved&&saved!==await StorageService.hashPin(pin))return false;write(UK,{name:'Sumaiya',role:'admin',isAuthenticated:true,lastLogin:new Date().toISOString()});return true;},
 setPin:async(pin:string)=>{if(!/^\d{4,8}$/.test(pin))throw new Error('Use a 4 to 8 digit PIN.');localStorage.setItem(PIN,await StorageService.hashPin(pin));},
 logout:()=>{localStorage.removeItem(UK);location.reload();},
 getProfiles:():Profile[]=>read(PK,defaults),saveProfile:(p:Profile)=>{const a=read<Profile[]>(PK,defaults);const i=a.findIndex(x=>x.id===p.id);i>=0?a[i]=p:a.push(p);write(PK,a);changed();cloud({entity:'profiles',action:'set',data:p});},
 getSelectedProfileId:()=>localStorage.getItem(SK)||'liyan',setSelectedProfileId:(id:string)=>{localStorage.setItem(SK,id);changed();},
 getRecords:async(id?:string)=>read<MedicalRecord[]>(RK,[]).filter(r=>!id||r.profileId===id).sort((a,b)=>`${b.date}${b.time||''}`.localeCompare(`${a.date}${a.time||''}`)),
 addRecord:async(r:Omit<MedicalRecord,'id'>)=>{const n={...r,id:StorageService.generateId(),timestamp:new Date().toISOString()};write(RK,[n,...read<MedicalRecord[]>(RK,[])]);changed();cloud({entity:'records',action:'set',data:n});return n;},
 updateRecord:async(r:MedicalRecord)=>{write(RK,read<MedicalRecord[]>(RK,[]).map(x=>x.id===r.id?r:x));changed();cloud({entity:'records',action:'set',data:r});},deleteRecord:async(id:string)=>{write(RK,read<MedicalRecord[]>(RK,[]).filter(x=>x.id!==id));changed();cloud({entity:'records',action:'delete',id});},
 getMedicines:async(id?:string)=>read<Medicine[]>(MK,[]).filter(m=>!id||m.profileId===id),saveMedicine:async(m:Medicine)=>{const a=read<Medicine[]>(MK,[]);const i=a.findIndex(x=>x.id===m.id);i>=0?a[i]=m:a.push(m);write(MK,a);changed();cloud({entity:'medicines',action:'set',data:m});},deleteMedicine:async(id:string)=>{write(MK,read<Medicine[]>(MK,[]).filter(x=>x.id!==id));changed();cloud({entity:'medicines',action:'delete',id});},
 exportData:():BackupData=>({version:2,exportedAt:new Date().toISOString(),profiles:read(PK,defaults),records:read(RK,[]),medicines:read(MK,[])}),
 importData:(b:BackupData)=>{if(b.version!==2||!Array.isArray(b.profiles)||!Array.isArray(b.records)||!Array.isArray(b.medicines))throw new Error('This is not a valid Koala Family backup.');write(PK,b.profiles);write(RK,b.records);write(MK,b.medicines);changed();cloud({entity:'profiles',action:'replace',backup:b});},
 applyCloudData:(data:Partial<BackupData>)=>{if(data.profiles)write(PK,data.profiles);if(data.records)write(RK,data.records);if(data.medicines)write(MK,data.medicines);changed();},
 getDailyInsight:(profileId:string,date:string):DailyFamilyInsight|null=>read<DailyFamilyInsight|null>(insightKey(profileId,date),null),
 saveDailyInsight:(profileId:string,date:string,insight:DailyFamilyInsight)=>write(insightKey(profileId,date),insight),
 clearDailyInsight:(profileId:string,date:string)=>localStorage.removeItem(insightKey(profileId,date)),
 setQuotaExceeded:(s=60)=>localStorage.setItem(QK,String(Date.now()+s*1000)),isQuotaExceeded:()=>Number(localStorage.getItem(QK)||0)>Date.now(),generateId:()=>`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
};
