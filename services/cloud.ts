import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, initializeFirestore, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { BackupData, MedicalRecord, Medicine, Profile } from '../types';

const app=initializeApp({
  projectId:'medicaltracker-family-2026',
  appId:'1:424481587400:web:0282e706e3f95b6506e5fd',
  storageBucket:'medicaltracker-family-2026.firebasestorage.app',
  apiKey:'AIzaSyBrvs_SB8pKst_tdVec1sF6NlsQsxER0HY',
  authDomain:'medicaltracker-family-2026.firebaseapp.com',
  messagingSenderId:'424481587400'
});
const auth=getAuth(app);const db=initializeFirestore(app,{ignoreUndefinedProperties:true});const root='families/koala-family';
const refs={profiles:collection(db,`${root}/profiles`),records:collection(db,`${root}/records`),medicines:collection(db,`${root}/medicines`)};
type Entity=keyof typeof refs;
type CloudStatus='offline'|'connecting'|'synced'|'error';
interface CloudMutation{entity:Entity;action:'set'|'delete'|'replace';data?:any;id?:string;backup?:BackupData;}

const authorized=(user:User|null)=>user?.email?.toLowerCase()==='hasanibooks.otp@gmail.com';
const readCollection=async<T>(entity:Entity):Promise<T[]>=>(await getDocs(refs[entity])).docs.map(item=>item.data() as T);
const replaceAll=async(backup:BackupData)=>{const batch=writeBatch(db);for(const entity of Object.keys(refs) as Entity[]){const existing=await getDocs(refs[entity]);existing.forEach(item=>batch.delete(item.ref));const values=entity==='profiles'?backup.profiles:entity==='records'?backup.records:backup.medicines;values.forEach((value:any)=>batch.set(doc(refs[entity],value.id),value));}await batch.commit();};

export const CloudService={
  currentUser:()=>auth.currentUser,
  signIn:async()=>{const result=await signInWithPopup(auth,new GoogleAuthProvider());if(!authorized(result.user)){await signOut(auth);throw new Error('This Google account is not authorized for the family database.');}return result.user;},
  signOut:()=>signOut(auth),
  start:(local:BackupData,onUpdate:(data:Partial<BackupData>)=>void,onStatus:(status:CloudStatus,user:User|null)=>void)=>{
    let unsubscribers:(()=>void)[]=[];let mutationHandler:((event:Event)=>void)|null=null;
    const stopData=()=>{unsubscribers.forEach(stop=>stop());unsubscribers=[];if(mutationHandler)window.removeEventListener('koalaCloudMutation',mutationHandler);mutationHandler=null;};
    const stopAuth=onAuthStateChanged(auth,async user=>{stopData();if(!authorized(user)){onStatus('offline',null);return;}onStatus('connecting',user);try{const [profiles,records,medicines]=await Promise.all([readCollection<Profile>('profiles'),readCollection<MedicalRecord>('records'),readCollection<Medicine>('medicines')]);if(!profiles.length&&!records.length&&!medicines.length){await replaceAll(local);}else onUpdate({profiles,records,medicines});
      const remote:{profiles:Profile[];records:MedicalRecord[];medicines:Medicine[]}={profiles,records,medicines};
      (Object.keys(refs) as Entity[]).forEach(entity=>unsubscribers.push(onSnapshot(refs[entity],snapshot=>{(remote as any)[entity]=snapshot.docs.map(item=>item.data());onUpdate({[entity]:(remote as any)[entity]});onStatus('synced',user);},()=>onStatus('error',user))));
      mutationHandler=(event:Event)=>{const detail=(event as CustomEvent<CloudMutation>).detail;if(!detail)return;if(detail.action==='replace'&&detail.backup){replaceAll(detail.backup).catch(()=>onStatus('error',user));return;}if(detail.action==='delete'&&detail.id){deleteDoc(doc(refs[detail.entity],detail.id)).catch(()=>onStatus('error',user));return;}if(detail.action==='set'&&detail.data?.id)setDoc(doc(refs[detail.entity],detail.data.id),detail.data).catch(()=>onStatus('error',user));};
      window.addEventListener('koalaCloudMutation',mutationHandler);
    }catch{onStatus('error',user);}});
    return()=>{stopData();stopAuth();};
  }
};
export type { CloudStatus };
