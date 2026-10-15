import { DailyFamilyInsight, DailyIslamicQuiz, MedicalRecord, Profile } from '../types';
import { getAge, localDateString } from './date';
import { StorageService } from './storage';
import { CloudService } from './cloud';
import { getAuth } from 'firebase/auth';

const waitForCloudAuth=async()=>{await getAuth().authStateReady();return CloudService.currentUser();};

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
  const dayNumber=Math.floor(Date.parse(`${date}T12:00:00Z`)/86400000);
  const profileSeed=profile.id.split('').reduce((total,char)=>total+char.charCodeAt(0),0);
  const seed=dayNumber+profileSeed;
  const base=fallbackInsight(profile);
  const adviceVariants=profile.id==='liyan'?
    [base.momAdvice,'குழந்தையின் தூக்கம், உணவு மற்றும் ஈரமான டயப்பர் எண்ணிக்கையை இன்று கவனியுங்கள். ஏதேனும் மாற்றம் குறித்து கவலை இருந்தால் மருத்துவரிடம் ஆலோசிக்கவும்.','குழந்தையுடன் பேசுவதும் மென்மையாக விளையாடுவதும் பிணைப்பை வளர்க்க உதவும். உடல்நலக் கவலைகளுக்கு மருத்துவரின் ஆலோசனையைப் பெறுங்கள்.']:
    [base.momAdvice,'குழந்தையுடன் விளையாடவும் பேசவும் தினமும் நேரம் ஒதுக்குங்கள். உணவு, தூக்கம் அல்லது வளர்ச்சி பற்றிய கவலை இருந்தால் மருத்துவரிடம் ஆலோசிக்கவும்.','வயதிற்கு ஏற்ற விளையாட்டு, நல்ல தூக்கம் மற்றும் பல் பராமரிப்பை ஊக்குவியுங்கள். உடல்நலக் கவலைகளுக்கு மருத்துவரை அணுகுங்கள்.'];
  return {...base,babyMessage:dailyMessages[((seed%dailyMessages.length)+dailyMessages.length)%dailyMessages.length],momAdvice:adviceVariants[((seed%adviceVariants.length)+adviceVariants.length)%adviceVariants.length]};
};

// Offline-first 365-day Islamic quiz bank. 114 surah-order questions + 114 name questions
// + 114 next-surah questions + 23 basic Islamic knowledge questions.
const surahNames=["Al-Fatihah","Al-Baqarah","Ali Imran","An-Nisa","Al-Maidah","Al-Anam","Al-Araf","Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Rad","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Muminun","An-Nur","Al-Furqan","Ash-Shuara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqiah","Al-Hadid","Al-Mujadilah","Al-Hashr","Al-Mumtahanah","As-Saff","Al-Jumuah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Maarij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Naziat","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-Ala","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Ad-Duha","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat","Al-Qariah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Maun","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"];
const knowledgeQuestions=[["இஸ்லாமின் முதல் தூண் எது?","ஷஹாதா","ஜகாத்","ஹஜ்","நோன்பு"],["ஒரு நாளில் கடமையான தொழுகைகள் எத்தனை?","ஐந்து","மூன்று","நான்கு","ஆறு"],["குர்ஆன் அருளப்பட்ட மாதம் எது?","ரமழான்","ரஜப்","ஷவ்வால்","முஹர்ரம்"],["தொழுகையில் முஸ்லிம்கள் எதை நோக்குகிறார்கள்?","கஅபா","அரஃபா","மதீனா","ஸஃபா"],["ஹஜ் நடைபெறும் நகரம் எது?","மக்கா","மதீனா","கெய்ரோ","தமாஸ்கஸ்"],["குர்ஆனில் மொத்தம் எத்தனை சூராக்கள்?","114","110","112","120"],["குர்ஆனில் மொத்தம் எத்தனை ஜுஸ்உகள்?","30","20","25","40"],["குர்ஆனின் முதல் சூரா எது?","அல்-ஃபாத்திஹா","அல்-பகரா","அல்-இக்லாஸ்","அன்-நாஸ்"],["குர்ஆனின் கடைசி சூரா எது?","அன்-நாஸ்","அல்-ஃபலக்","அல்-இக்லாஸ்","அல்-கௌஸர்"],["குர்ஆனின் மிக நீளமான சூரா எது?","அல்-பகரா","அல்-ஃபாத்திஹா","அல்-கௌஸர்","அன்-நாஸ்"],["குர்ஆனின் மிகச் சிறிய சூரா எது?","அல்-கௌஸர்","அல்-பகரா","ஆல் இம்ரான்","அல்-கஹ்ஃப்"],["ரமழானில் நோன்பு திறப்பதை என்ன சொல்வார்கள்?","இஃப்தார்","ஸஹர்","தராவீஹ்","ஸகாத்"],["விடியற்காலைக்கு முன் நோன்புக்காக உண்பது என்ன?","ஸஹர்","இஃப்தார்","ஹஜ்","ஸகாத்"],["வெள்ளிக்கிழமை கூட்டுத் தொழுகை என்ன?","ஜுமுஆ","வித்ர்","தராவீஹ்","ஜனாஸா"],["மக்காவிலிருந்து மதீனாவுக்கு இடம்பெயர்ந்த நிகழ்வு என்ன?","ஹிஜ்ரத்","ஹஜ்","உம்ரா","இஃப்தார்"],["நபி முஹம்மது (ஸல்) பிறந்த நகரம் எது?","மக்கா","மதீனா","தாயிஃப்","ஜெருசலேம்"],["முதல் மனிதரும் நபியுமாக இஸ்லாமில் அறியப்படுபவர் யார்?","ஆதம் (அலை)","நூஹ் (அலை)","இப்ராஹீம் (அலை)","மூஸா (அலை)"],["கப்பல் கட்டிய நபியாக அறியப்படுபவர் யார்?","நூஹ் (அலை)","யூசுப் (அலை)","யூனுஸ் (அலை)","ஈஸா (அலை)"],["மீனின் வயிற்றில் இருந்த நபி யார்?","யூனுஸ் (அலை)","மூஸா (அலை)","தாவூத் (அலை)","இப்ராஹீம் (அலை)"],["குர்ஆனில் பெயருடன் குறிப்பிடப்படும் பெண் யார்?","மர்யம்","ஆசியா","ஹாஜரா","கதீஜா"],["குர்ஆனை நபியிடம் கொண்டு வந்த வானவர் யார்?","ஜிப்ரீல்","மீகாயீல்","இஸ்ராஃபீல்","மாலிக்"],["ஸகாத் என்பது எதுடன் தொடர்புடைய கடமை?","தகுதியானவர்களுக்கு செல்வத்திலிருந்து வழங்குதல்","மக்கா பயணம்","நோன்பு திறத்தல்","வெள்ளித் தொழுகை"],["இஸ்லாமிய ஆண்டின் முதல் மாதம் எது?","முஹர்ரம்","ரமழான்","ஷவ்வால்","ரஜப்"]];
const makeDailyQuizBank=():Omit<DailyIslamicQuiz,'generatedAt'|'source'>[]=>{
 const items:Omit<DailyIslamicQuiz,'generatedAt'|'source'>[]=[];
 for(let i=0;i<114;i++){
  const name=surahNames[i];
  const numbers=[i+1,((i+17)%114)+1,((i+41)%114)+1,((i+73)%114)+1];
  const options=numbers.map(String);
  items.push({question:`குர்ஆனில் ${name} சூரா எத்தனையாவது சூரா?`,options,correctIndex:0,explanation:`${name} என்பது குர்ஆனின் ${i+1}வது சூரா.`});
  const choices=[name,surahNames[(i+17)%114],surahNames[(i+41)%114],surahNames[(i+73)%114]];
  items.push({question:`குர்ஆனில் ${i+1}வது சூராவின் பெயர் என்ன?`,options:choices,correctIndex:0,explanation:`குர்ஆனின் ${i+1}வது சூரா ${name}.`});
  const next=surahNames[(i+1)%114];
  const afterChoices=[next,surahNames[(i+18)%114],surahNames[(i+42)%114],surahNames[(i+74)%114]];
  items.push({question:`குர்ஆன் வரிசையில் ${name} சூராவுக்குப் பிறகு வருவது எது?`,options:afterChoices,correctIndex:0,explanation:`${name} சூராவுக்குப் பிறகு ${next} சூரா வருகிறது.`});
 }
 for(const [question,...options] of knowledgeQuestions){items.push({question,options,correctIndex:0,explanation:`சரியான பதில்: ${options[0]}.`});}
 return items;
};
const fallbackQuizzes=makeDailyQuizBank();
const fallbackQuiz=(date:string):DailyIslamicQuiz=>{
 const [year,month,day]=date.split('-').map(Number);
 const dayOfYear=Math.floor((Date.UTC(year,month-1,day)-Date.UTC(year,0,1))/86400000);
 // Every calendar day gets a distinct question; leap day also works.
 const item=fallbackQuizzes[dayOfYear%fallbackQuizzes.length];
 const shift=dayOfYear%4;
 const options=item.options.map((_,index)=>item.options[(index+shift)%4]);
 return {...item,options,correctIndex:(4-shift)%4,generatedAt:new Date().toISOString(),source:'fallback'};
};

const callGeminiProxy=async<T>(payload:Record<string,unknown>):Promise<T>=>{
  const user=CloudService.currentUser();
  if(!user)throw new Error('CLOUD_SIGN_IN_REQUIRED');
  const idToken=await user.getIdToken();
  let response:Response;
  try { response=await fetch(GEMINI_PROXY_URL,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer '+idToken
    },
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(30000)
  }); } catch(error:any) { if(error?.name==='TimeoutError'||error?.name==='AbortError')throw new Error('AI_TIMEOUT'); throw new Error('AI_WORKER_UNREACHABLE: Check the deployed Worker URL and Cloudflare route.'); }
  const contentType=response.headers.get('content-type')||'';
  if(!contentType.includes('application/json'))throw new Error('AI_WORKER_WRONG_ROUTE: Endpoint returned a web page instead of AI JSON.');
  if(response.status===401||response.status===403)throw new Error('CLOUD_AUTH_REQUIRED');
  if(response.status===429)throw new Error('429');
  if(!response.ok){let detail='';try{const body=await response.json() as {error?:string};detail=body.error||'';}catch{}throw new Error('GEMINI_PROXY_'+response.status+(detail?': '+detail:''));}
  return await response.json() as T;
};

export const GeminiService={
 instantInsight:(profile:Profile):DailyFamilyInsight=>StorageService.getDailyInsight(profile.id,localDateString())||dailyFallbackInsight(profile,localDateString()),
 instantIslamicQuiz:():DailyIslamicQuiz=>fallbackQuiz(localDateString()),
 getDailyIslamicQuiz:async(_force=false):Promise<DailyIslamicQuiz>=>{
  // The daily question is deterministic and available instantly, without network or AI delays.
  const today=localDateString();
  const quiz=fallbackQuiz(today);
  StorageService.saveDailyIslamicQuiz(today,quiz);
  return quiz;
 },
 getDailyFamilyInsight:async(profile:Profile,force=false):Promise<DailyFamilyInsight>=>{
   const today=localDateString();
   if(!force){
     const cached=StorageService.getDailyInsight(profile.id,today);
     if(cached&&containsTamil(cached.babyMessage)&&containsTamil(cached.momAdvice))return cached;
   }
   await waitForCloudAuth();
   if(StorageService.isQuotaExceeded()||!CloudService.currentUser()){
     const fallback=dailyFallbackInsight(profile,today);
     StorageService.saveDailyInsight(profile.id,today,fallback);
     return fallback;
   }
   try{
     const parsed=await callGeminiProxy<{babyMessage:string;momAdvice:string}>({
       action:'daily',
       date:today,
       profile:{name:profile.name,age:getAge(profile.birthDate)}
     });
     if(!containsTamil(parsed.babyMessage)||!containsTamil(parsed.momAdvice))throw new Error('Gemini did not return Tamil');
     const insight:DailyFamilyInsight={babyMessage:parsed.babyMessage,momAdvice:parsed.momAdvice,generatedAt:new Date().toISOString(),source:'ai'};
     StorageService.saveDailyInsight(profile.id,today,insight);
     return insight;
   }catch(error:any){
     if(String(error?.message).includes('429'))StorageService.setQuotaExceeded(60);
     const fallback=dailyFallbackInsight(profile,today);
     const cached=StorageService.getDailyInsight(profile.id,today);
     if(cached?.source==='ai')return cached;
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
