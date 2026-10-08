import { DailyFamilyInsight, MedicalRecord, Profile } from '../types';
import { getAge, localDateString } from './date';
import { StorageService } from './storage';
import { CloudService } from './cloud';

const GEMINI_PROXY_URL =
  import.meta.env.VITE_GEMINI_PROXY_URL ||
  'https://medicaltracker-ai.mohamedwajeethuali.workers.dev';

const fallbackInsight=(profile:Profile):DailyFamilyInsight=>profile.id==='liyan'?{babyMessage:'அம்மா, உங்கள் குரலும் மென்மையான அணைப்பும் எனக்குப் பாதுகாப்பாக உணர வைக்கிறது. இன்று என்னுடன் இருப்பதற்கு நன்றி.',momAdvice:'லியானின் பசி மற்றும் தூக்க அறிகுறிகளைக் கவனித்து அதற்கேற்ப பராமரியுங்கள். காய்ச்சல், மூச்சுத் திணறல், சரியாகப் பால் குடிக்காமை அல்லது ஈரமான டயப்பர் குறைதல் இருந்தால் உடனடியாக மருத்துவரை அணுகுங்கள்.',generatedAt:new Date().toISOString(),source:'fallback'}:{babyMessage:'அம்மா, நான் தினமும் புதிய விஷயங்களைக் கற்றுக்கொள்கிறேன். நீங்கள் என்னுடன் பேசுவதும், கதை படிப்பதும், விளையாடுவதும் எனக்கு மிகவும் மகிழ்ச்சி தருகிறது.',momAdvice:'லியாவுக்கு தினமும் உடல் இயக்கம் நிறைந்த விளையாட்டு, உரையாடல், சீரான உணவு, போதுமான தூக்கம் மற்றும் பல் பராமரிப்பை வழங்குங்கள். உடல்நலம், வளர்ச்சி அல்லது முன்னேற்றம் குறித்து கவலை இருந்தால் மருத்துவரிடம் ஆலோசிக்கவும்.',generatedAt:new Date().toISOString(),source:'fallback'};

const containsTamil=(value:unknown):value is string=>typeof value==='string'&&/[\u0B80-\u0BFF]/.test(value);

const dailyMessages = [
  'ஒவ்வொரு நாளும் உங்கள் அன்பும் கவனமும் எனக்கு புதிய நம்பிக்கையைத் தருகிறது.',
  'உங்கள் புன்னகையும் அரவணைப்பும் என் நாளை மகிழ்ச்சியாக்குகிறது.',
  'நாம் இன்று பகிரும் சிறிய தருணங்கள் நாளைய இனிய நினைவுகளாகும்.',
  'உங்கள் குரலைக் கேட்கும் ஒவ்வொரு முறையும் நான் பாதுகாப்பாக உணர்கிறேன்.',
  'உங்களுடன் விளையாடியும் கற்றுக்கொண்டும் நான் ஒவ்வொரு நாளும் வளர்கிறேன்.',
  'உங்கள் பொறுமையும் அன்பும் என் உலகத்தை அழகாக்குகிறது.',
  'இன்று நாம் சேர்ந்து சிரிக்கும் நேரமே எனக்கு மிகப் பெரிய பரிசு.'
];

const dailyFallbackInsight=(profile:Profile,date:string):DailyFamilyInsight=>{
  const seed=`${profile.id}-${date}`.split('').reduce((total,char)=>total+char.charCodeAt(0),0);
  return {...fallbackInsight(profile),babyMessage:dailyMessages[seed%dailyMessages.length]};
};

const callGeminiProxy=async<T>(payload:Record<string,unknown>):Promise<T>=>{
  const user=CloudService.currentUser();
  if(!user)throw new Error('CLOUD_SIGN_IN_REQUIRED');
  const idToken=await user.getIdToken();
  const response=await fetch(GEMINI_PROXY_URL,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer '+idToken
    },
    body:JSON.stringify(payload)
  });
  if(response.status===401||response.status===403)throw new Error('CLOUD_AUTH_REQUIRED');
  if(response.status===429)throw new Error('429');
  if(!response.ok)throw new Error('GEMINI_PROXY_'+response.status);
  return await response.json() as T;
};

export const GeminiService={
 getDailyFamilyInsight:async(profile:Profile,force=false):Promise<DailyFamilyInsight>=>{
   const today=localDateString();
   if(!force){
     const cached=StorageService.getDailyInsight(profile.id,today);
     if(cached&&containsTamil(cached.babyMessage)&&containsTamil(cached.momAdvice))return cached;
   }
   if(StorageService.isQuotaExceeded()||!CloudService.currentUser()){
     const fallback=dailyFallbackInsight(profile,today);
     StorageService.saveDailyInsight(profile.id,today,fallback);
     return fallback;
   }
   try{
     const parsed=await callGeminiProxy<{babyMessage:string;momAdvice:string}>({
       action:'daily',
       profile:{name:profile.name,age:getAge(profile.birthDate)}
     });
     if(!containsTamil(parsed.babyMessage)||!containsTamil(parsed.momAdvice))throw new Error('Gemini did not return Tamil');
     const insight:DailyFamilyInsight={babyMessage:parsed.babyMessage,momAdvice:parsed.momAdvice,generatedAt:new Date().toISOString(),source:'ai'};
     StorageService.saveDailyInsight(profile.id,today,insight);
     return insight;
   }catch(error:any){
     if(String(error?.message).includes('429'))StorageService.setQuotaExceeded(60);
     const fallback=dailyFallbackInsight(profile,today);
     StorageService.saveDailyInsight(profile.id,today,fallback);
     return fallback;
   }
 },
 ask:async(question:string,profile:Profile,records:MedicalRecord[]):Promise<string>=>{
   if(StorageService.isQuotaExceeded())return 'The assistant is temporarily unavailable because its request limit was reached.';
   if(!CloudService.currentUser())return 'Sign in to Family Cloud Sync first to use the AI assistant securely.';
   const context=records.slice(0,12).map(r=>r.date+': '+r.type+' - '+r.title+(r.value!==undefined?' ('+r.value+' '+(r.unit||'')+')':'')+'; '+r.details).join('\n');
   try{
     const result=await callGeminiProxy<{text:string}>({
       action:'ask',
       question:question.slice(0,4000),
       profile:{name:profile.name,age:getAge(profile.birthDate),allergies:profile.allergies||'not recorded'},
       context:context.slice(0,12000)
     });
     return result.text||'No response was available.';
   }catch(error:any){
     if(String(error?.message).includes('429'))StorageService.setQuotaExceeded(60);
     if(String(error?.message).includes('AUTH'))return 'Please sign out and sign back in to Family Cloud Sync, then try again.';
     return 'I could not connect to the assistant. For urgent symptoms, contact a clinician or emergency service now.';
   }
 }
};
