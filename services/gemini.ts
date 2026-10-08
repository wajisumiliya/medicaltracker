import { DailyFamilyInsight, DailyIslamicQuiz, MedicalRecord, Profile } from '../types';
import { getAge, localDateString } from './date';
import { StorageService } from './storage';
import { CloudService } from './cloud';

const GEMINI_PROXY_URL =
  import.meta.env.VITE_GEMINI_PROXY_URL ||
  'https://medicaltracker-ai.islamicquiz.workers.dev';

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

const fallbackQuizzes:Omit<DailyIslamicQuiz,'generatedAt'|'source'>[]=[
 {question:'இஸ்லாமின் ஐந்து தூண்களில் முதலாவது எது?',options:['ஷஹாதா','ஜகாத்','ஹஜ்','நோன்பு'],correctIndex:0,explanation:'அல்லாஹ்வைத் தவிர வணக்கத்திற்குரியவன் யாருமில்லை என்றும் முஹம்மது நபி (ஸல்) அல்லாஹ்வின் தூதர் என்றும் சாட்சி கூறுவது ஷஹாதா. இதுவே இஸ்லாமின் முதல் தூண்.'},
 {question:'ஒரு நாளில் முஸ்லிம்கள் எத்தனை நேரத் தொழுகைகளை நிறைவேற்றுகிறார்கள்?',options:['மூன்று','நான்கு','ஐந்து','ஆறு'],correctIndex:2,explanation:'ஃபஜ்ர், ளுஹர், அஸர், மஃரிப், இஷா என ஒரு நாளில் ஐந்து நேரத் தொழுகைகள் கடமையாகும்.'},
 {question:'திருக்குர்ஆன் அருளப்பட்ட மாதம் எது?',options:['முஹர்ரம்','ரமழான்','ஷவ்வால்','ரஜப்'],correctIndex:1,explanation:'திருக்குர்ஆன் ரமழான் மாதத்தில் அருளப்பட்டது. இந்த மாதத்தில் முஸ்லிம்கள் நோன்பு நோற்கிறார்கள்.'},
 {question:'முஸ்லிம்கள் தொழுகையில் எந்தத் திசையை நோக்குகிறார்கள்?',options:['மதீனா','ஜெருசலேம்','கஅபா','அரஃபா'],correctIndex:2,explanation:'மக்காவில் உள்ள புனித கஅபாவை நோக்கிய கிப்லா திசையில் முஸ்லிம்கள் தொழுகிறார்கள்.'},
 {question:'ஹஜ் கடமை நிறைவேற்றப்படும் புனித நகரம் எது?',options:['மக்கா','மதீனா','கெய்ரோ','தமாஸ்கஸ்'],correctIndex:0,explanation:'உடல் மற்றும் பொருளாதார வசதி உள்ள முஸ்லிம்கள் வாழ்நாளில் ஒருமுறை மக்காவில் ஹஜ் கடமையை நிறைவேற்ற வேண்டும்.'}
];
const fallbackQuiz=(date:string):DailyIslamicQuiz=>{const day=Math.floor(new Date(`${date}T00:00:00`).getTime()/86400000);return {...fallbackQuizzes[Math.abs(day)%fallbackQuizzes.length],generatedAt:new Date().toISOString(),source:'fallback'};};

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
 getDailyIslamicQuiz:async(force=false):Promise<DailyIslamicQuiz>=>{
   const today=localDateString();
   if(!force){const cached=StorageService.getDailyIslamicQuiz(today);if(cached&&(cached.source==='ai'||!CloudService.currentUser()))return cached;}
   if(StorageService.isQuotaExceeded()||!CloudService.currentUser()){const quiz=fallbackQuiz(today);StorageService.saveDailyIslamicQuiz(today,quiz);return quiz;}
   try{
     const parsed=await callGeminiProxy<{question:string;options:string[];correctIndex:number;explanation:string}>({action:'islamicQuiz',date:today});
     if(!containsTamil(parsed.question)||!containsTamil(parsed.explanation)||!Array.isArray(parsed.options)||parsed.options.length!==4||parsed.options.some(option=>!containsTamil(option))||!Number.isInteger(parsed.correctIndex)||parsed.correctIndex<0||parsed.correctIndex>3)throw new Error('Invalid quiz response');
     const quiz:DailyIslamicQuiz={...parsed,generatedAt:new Date().toISOString(),source:'ai'};
     StorageService.saveDailyIslamicQuiz(today,quiz);return quiz;
   }catch(error:any){if(String(error?.message).includes('429'))StorageService.setQuotaExceeded(60);const quiz=fallbackQuiz(today);StorageService.saveDailyIslamicQuiz(today,quiz);return quiz;}
 },
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
