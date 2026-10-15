import { DailyFamilyInsight, DailyIslamicQuiz, MedicalRecord, Profile } from '../types';
import { getAge, localDateString } from './date';
import { StorageService } from './storage';
import { CloudService } from './cloud';
import { getAuth } from 'firebase/auth';

const waitForCloudAuth=async()=>{await getAuth().authStateReady();return CloudService.currentUser();};

const GEMINI_PROXY_URL =
  import.meta.env.VITE_GEMINI_PROXY_URL ||
  'https://medicaltracker-ai.islamicquiz.workers.dev';

const containsTamil=(value:unknown):value is string=>typeof value==='string'&&/[\u0B80-\u0BFF]/.test(value);
// 20 x 19 unique age-appropriate tips: 365 consecutive days without repeats.
const babyDailyTopics={"babyActions":["குழந்தையோட கண்களைப் பார்த்து மெதுவா பேசுங்க","குழந்தை விழித்திருக்கும்போது அருகிலிருந்து பாடுங்க","குழந்தையின் பசி அறிகுறிகளைக் கவனிங்க","குழந்தையைத் தூக்கும்போது தலைக்கும் கழுத்துக்கும் ஆதரவு கொடுங்க","விழித்திருக்கும்போது மேற்பார்வையில் வயிற்றில் படுக்க வைத்து விளையாட விடுங்க","குழந்தை சத்தம் போட்டால் பதிலுக்குப் பேசுங்க","குழந்தை சிரிக்கும்போது நீங்களும் சிரிங்க","குழந்தைக்கு மென்மையான சத்தங்களைக் கேட்க வையுங்க","குழந்தையின் தூக்க அறிகுறிகளைக் கவனிங்க","பாதுகாப்பான விளையாட்டுப் பொருளைக் காட்டுங்க","குழந்தையுடன் மெதுவாக உரையாடுங்க","குழந்தை பிடிக்க முயலும் பொருளைக் கவனமாகக் காட்டுங்க","குழந்தையின் முகபாவனைகளைக் கவனிங்க","குழந்தைக்கு இடையிடையே ஓய்வு கொடுங்க","குழந்தை விழித்திருக்கும்போது நிறமுள்ள படங்களைக் காட்டுங்க","குழந்தையின் அசைவுகளைக் கவனிங்க","குழந்தையுடன் அன்பாகப் பேசுங்க","குழந்தையின் வழக்கமான பழக்கங்களைக் கவனிங்க","குழந்தை சோர்வாக இருந்தால் விளையாட்டை நிறுத்துங்க","குழந்தைக்கு அருகில் இருந்து சின்னக் கதை சொல்லுங்க"],"babyNotes":["இந்த வயதில் உங்க குரல் குழந்தைக்கு ரொம்பப் பிடிக்கும்","குழந்தையின் தேவைக்கு ஏற்ப பால் கொடுப்பது முக்கியம்","தூங்கும்போது முதுகில் படுக்க வையுங்க","தூங்கும் இடத்தில் தலையணையும் பொம்மையும் வேண்டாம்","குழந்தையை உயரமான இடத்தில் தனியாக விடாதீங்க","சிறிய பொருள்களை குழந்தைக்கு எட்டாத இடத்தில் வையுங்க","ஒவ்வொரு குழந்தையும் தன் வேகத்தில் வளருது","விழித்திருக்கும்போது மட்டும் வயிற்றில் படுக்க வைத்து விளையாட விடுங்க","குழந்தை விரும்பினால் மட்டும் விளையாட்டைத் தொடருங்க","சோர்வாக இருந்தால் ஓய்வு கொடுங்க","மென்மையான உரையாடல் பிணைப்பை வளர்க்கும்","குழந்தையின் பாதுகாப்புக்கு முன்னுரிமை கொடுங்க","விளையாட்டுப் பொருளில் சிறிய பாகங்கள் இருக்கக் கூடாது","குழந்தையின் எதிர்வினையைக் கவனிங்க","தூங்கும் இடம் சமமாகவும் உறுதியாகவும் இருக்கட்டும்","பால் குடிப்பதில் கவலை இருந்தால் மருத்துவரிடம் கேளுங்க","புதிய சத்தங்களைக் கேட்கும்போது குழந்தையைக் கவனிங்க","குழந்தைக்கு அருகில் பெரியவர் இருப்பது முக்கியம்","வளர்ச்சி குறித்த கவலை இருந்தால் மருத்துவரை அணுகுங்க"],"toddlerActions":["குழந்தையோட ஒரு குட்டிக் கதை படிங்க","குழந்தையுடன் சேர்ந்து பாடுங்க","வண்ணங்களைச் சொல்லி விளையாடுங்க","கட்டைகள் அடுக்கி விளையாடுங்க","இரண்டு நல்ல தேர்வுகளில் ஒன்றைத் தேர்ந்தெடுக்க விடுங்க","பாதுகாப்பான இடத்தில் வெளியே விளையாடுங்க","குழந்தை சொல்றதை நிதானமா கேளுங்க","குழந்தையின் முயற்சியைப் பாராட்டுங்க","படங்களைப் பார்த்துப் பேசுங்க","பொம்மைகளைச் சேர்த்து வைக்கப் பழக்குங்க","பழங்களின் பெயர்களைச் சொல்லிக் கொடுங்க","ஒன்றிலிருந்து ஐந்து வரை எண்ணிப் பாருங்க","கைகளைக் கழுவப் பழக்குங்க","சுற்றியுள்ள பொருள்களைப் பார்த்துப் பேசுங்க","குழந்தையின் கேள்விகளுக்குப் பதில் சொல்லுங்க","சேர்ந்து படம் வரையுங்க","ஒரு சின்ன வீட்டு வேலையில் உதவ விடுங்க","விலங்குகளின் சத்தங்களைச் செய்து விளையாடுங்க","உணர்ச்சிகளின் பெயர்களைச் சொல்லிக் கொடுங்க","குழந்தையுடன் சிரிச்சு விளையாடுங்க"],"toddlerNotes":["விளையாட்டின் மூலம்தான் குழந்தைகள் நிறைய கற்றுக்குவாங்க","குழந்தையின் முயற்சியைப் பாராட்டுங்க","விளையாடும்போது அருகில் இருந்து கவனிங்க","பேசுவதற்கு குழந்தைக்கு நேரம் கொடுங்க","சின்ன பழக்கங்களை தினமும் பயிற்சி செய்யலாம்","உணவு நேரத்தை அமைதியா வையுங்க","போதுமான தூக்கம் முக்கியம்","தவறு செய்தாலும் நிதானமா சொல்லிக் கொடுங்க","சேர்ந்து பேசுவது மொழி வளர்ச்சிக்கு உதவும்","வயதுக்கேற்ற பாதுகாப்பான பொருள்களைப் பயன்படுத்துங்க","சின்ன தேர்வுகள் தன்னம்பிக்கை தரும்","ஒரே நேரத்தில் அதிகம் சொல்ல வேண்டாம்","ஒவ்வொரு குழந்தையும் தன் வேகத்தில் கற்றுக்கொள்ளும்","திரை நேரத்துக்குப் பதிலா சேர்ந்து விளையாடுங்க","சோர்வா இருந்தா ஓய்வு கொடுங்க","சின்ன வெற்றியையும் கொண்டாடுங்க","குழந்தையின் உணர்ச்சிகளைப் புரிஞ்சுக்க முயற்சி செய்யுங்க","தினசரி பழக்கங்கள் நம்பிக்கை தரும்","வளர்ச்சி பற்றி கவலை இருந்தா மருத்துவரிடம் கேளுங்க"]};
const dailyFallbackInsight=(profile:Profile,date:string):DailyFamilyInsight=>{
 const [year,month,day]=date.split('-').map(Number);
 const dayOfYear=Math.floor((Date.UTC(year,month-1,day)-Date.UTC(year,0,1))/86400000);
 const birth=profile.birthDate?new Date(profile.birthDate+'T12:00:00Z'):null;
 const ageMonths=birth?Math.max(0,(year-birth.getUTCFullYear())*12+month-1-birth.getUTCMonth()-(day<birth.getUTCDate()?1:0)):0;
 const infant=ageMonths<12;
 const actions=infant?babyDailyTopics.babyActions:babyDailyTopics.toddlerActions;
 const notes=infant?babyDailyTopics.babyNotes:babyDailyTopics.toddlerNotes;
 const offset=profile.id.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0)%365;
 const index=(dayOfYear+offset)%365;
 const babyMessage=infant?'அம்மா, உங்க குரலைக் கேட்கவும் உங்க முகத்தைப் பார்க்கவும் எனக்கு ரொம்பப் பிடிக்கும்.':'அம்மா, இன்னைக்கு நாம சேர்ந்து விளையாடலாமா? உங்ககூட நேரம் செலவிட எனக்கு ரொம்பப் பிடிக்கும்.';
 return {babyMessage,momAdvice:`${actions[index%20]}. ${notes[Math.floor(index/20)%19]}.`,generatedAt:new Date().toISOString(),source:'fallback'};
};

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
  const next=surahNames[i===113?112:i+1];
  const afterChoices=[next,surahNames[(i+18)%114],surahNames[(i+42)%114],surahNames[(i+74)%114]];
  items.push({question:i===113?`குர்ஆன் வரிசையில் ${name} சூராவுக்கு முன்பு வருவது எது?`:`குர்ஆன் வரிசையில் ${name} சூராவுக்குப் பிறகு வருவது எது?`,options:afterChoices,correctIndex:0,explanation:i===113?`${name} சூராவுக்கு முன்பு ${next} சூரா வருகிறது.`:`${name} சூராவுக்குப் பிறகு ${next} சூரா வருகிறது.`});
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
 instantInsight:(profile:Profile):DailyFamilyInsight=>dailyFallbackInsight(profile,localDateString()),
 instantIslamicQuiz:():DailyIslamicQuiz=>fallbackQuiz(localDateString()),
 getDailyIslamicQuiz:async(_force=false):Promise<DailyIslamicQuiz>=>{
  // The daily question is deterministic and available instantly, without network or AI delays.
  const today=localDateString();
  const quiz=fallbackQuiz(today);
  StorageService.saveDailyIslamicQuiz(today,quiz);
  return quiz;
 },
 getDailyFamilyInsight:async(profile:Profile,_force=false):Promise<DailyFamilyInsight>=>dailyFallbackInsight(profile,localDateString()),
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
