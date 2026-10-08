import React,{useEffect,useState} from 'react';
import { Bell,BookOpenCheck,CheckCircle2,Loader2,XCircle } from 'lucide-react';
import { DailyIslamicQuiz as Quiz } from '../types';
import { GeminiService } from '../services/gemini';
import { NotificationService } from '../services/notifications';
import { localDateString } from '../services/date';

export const DailyIslamicQuiz:React.FC=()=>{
 const today=localDateString();
 const answerKey=`koala_islamic_quiz_answer_${today}`;
 const [quiz,setQuiz]=useState<Quiz|null>(null);
 const [selected,setSelected]=useState<number|null>(()=>{const saved=localStorage.getItem(answerKey);return saved===null?null:Number(saved);});
 const [loading,setLoading]=useState(true);
 const [notificationsEnabled,setNotificationsEnabled]=useState(()=>('Notification'in window)&&Notification.permission==='granted');
 useEffect(()=>{let active=true;GeminiService.getDailyIslamicQuiz().then(value=>{if(!active)return;setQuiz(value);setLoading(false);NotificationService.notifyQuizReady(today);});return()=>{active=false;};},[today]);
 const choose=(index:number)=>{if(selected!==null)return;localStorage.setItem(answerKey,String(index));setSelected(index);};
 const enableNotifications=async()=>{const enabled=await NotificationService.requestPermission();setNotificationsEnabled(enabled);if(enabled&&quiz)NotificationService.notifyQuizReady(today);};
 if(loading||!quiz)return <div className="min-h-[420px] flex items-center justify-center gap-3 text-gray-500"><Loader2 className="animate-spin"/><span>இன்றைய வினா தயாராகிறது...</span></div>;
 const correct=selected===quiz.correctIndex;
 return <section className="max-w-3xl mx-auto space-y-4">
  <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-6 md:p-8 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-200">தினசரி அறிவுப் பயணம்</p><h2 className="text-2xl md:text-3xl font-bold mt-2 flex items-center gap-3"><BookOpenCheck/>இன்றைய இஸ்லாமிய வினா</h2><p className="text-sm text-emerald-100 mt-3">ஒவ்வொரு நாளும் ஒரு புதிய தமிழ் கேள்வி</p></div><span className="text-xs bg-white/10 rounded-full px-3 py-1.5 whitespace-nowrap">{today}</span></div></div>
  {!notificationsEnabled&&<button onClick={enableNotifications} className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-center justify-center gap-2 font-semibold"><Bell size={18}/>தினசரி வினா அறிவிப்பை இயக்கவும்</button>}
  <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8"><p className="text-xs font-bold text-emerald-700 mb-3">கேள்வி</p><h3 className="text-xl md:text-2xl font-bold leading-relaxed text-gray-900">{quiz.question}</h3><div className="grid gap-3 mt-6">{quiz.options.map((option,index)=>{const answered=selected!==null;const isCorrect=index===quiz.correctIndex;const isSelected=index===selected;const style=answered&&isCorrect?'border-emerald-500 bg-emerald-50 text-emerald-900':answered&&isSelected?'border-rose-500 bg-rose-50 text-rose-900':'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40';return <button key={index} disabled={answered} onClick={()=>choose(index)} className={`text-left border-2 rounded-xl p-4 font-semibold transition-colors disabled:cursor-default ${style}`}><span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white border mr-3 text-sm">{String.fromCharCode(65+index)}</span>{option}</button>;})}</div>
   {selected!==null&&<div className={`mt-6 rounded-xl border p-5 ${correct?'bg-emerald-50 border-emerald-200':'bg-rose-50 border-rose-200'}`}><div className={`font-bold flex items-center gap-2 ${correct?'text-emerald-800':'text-rose-800'}`}>{correct?<><CheckCircle2/>மாஷா அல்லாஹ்! சரியான பதில். வாழ்த்துகள்!</>:<><XCircle/>இந்தப் பதில் சரியல்ல. கற்றுக்கொள்வோம்!</>}</div><p className="mt-3 text-sm leading-relaxed text-gray-700">{quiz.explanation}</p>{!correct&&<p className="mt-3 text-sm font-semibold text-emerald-800">சரியான பதில்: {quiz.options[quiz.correctIndex]}</p>}</div>}
   <p className="mt-5 text-[11px] text-gray-400">{quiz.source==='ai'?'AI உருவாக்கிய தினசரி வினா':'இணைப்பு இல்லாதபோது வழங்கப்படும் பாதுகாப்பு வினா'} • நாளை புதிய கேள்வி கிடைக்கும்</p>
  </div>
 </section>;
};
