
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Calendar, Clock, Baby, Plus, Droplets, Cookie, Pill, 
  Check, GlassWater, Sparkles, Lock, Waves, X, 
  Settings, Trash2, Edit2, AlertCircle, 
  ChevronRight, MapPin, ChevronLeft, Heart, Stethoscope, History as HistoryIcon,
  Save, RefreshCw, Layers, CalendarCheck, Sun, Moon, Sunrise,
  MessageCircle, ShieldCheck, Key, ExternalLink
} from 'lucide-react';
import { DateMetrics, MedicalRecord, Medicine, MedicineSlot, RecordType, EventStatus, User as UserType, DailyInsights } from '../types';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';

const START_DATE_STR = "2025-08-28"; 
const DUE_DATE_STR = "2026-06-01";
const NUT_ITEMS = ['Almonds', 'Walnuts', 'Seeds', 'Dates'];

const PREGNANCY_MILESTONES = [
  { week: 1, size: "Tiny Spec", fact: "Conception journey begins." },
  { week: 2, size: "Tiny Spec", fact: "Ovulation and fertilization." },
  { week: 3, size: "Tiny Spec", fact: "Implantation in the uterus." },
  { week: 4, size: "Poppy Seed", fact: "The blastocyst is officially an embryo." },
  { week: 5, size: "Orange Seed", fact: "The heart begins to form and beat." },
  { week: 6, size: "Sweet Pea", fact: "Facial features start to take shape." },
  { week: 7, size: "Blueberry", fact: "Brain is developing rapidly." },
  { week: 8, size: "Raspberry", fact: "Embryo is now moving, though you can't feel it." },
  { week: 9, size: "Green Olive", fact: "The tail at the bottom of the spinal cord is gone." },
  { week: 10, size: "Prune", fact: "Vital organs are starting to function." },
  { week: 11, size: "Lime", fact: "Baby is busy kicking and stretching." },
  { week: 12, size: "Plum", fact: "Baby has developed reflexes." },
  { week: 13, size: "Lemon", fact: "Fingerprints are forming on the tiny fingers." },
  { week: 14, size: "Peach", fact: "Baby can squint, frown, and grimace." },
  { week: 15, size: "Apple", fact: "Baby can sense light and develop taste buds." },
  { week: 16, size: "Avocado", fact: "Ears are in their final position." },
  { week: 17, size: "Pomegranate", fact: "Skeleton is changing from soft cartilage to bone." },
  { week: 18, size: "Artichoke", fact: "Baby can hear your heartbeat and voice." },
  { week: 19, size: "Mango", fact: "Nerve cells for senses are developing." },
  { week: 20, size: "Banana", fact: "Halfway there! Gender is usually visible now." },
  { week: 21, size: "Carrot", fact: "Baby is swallowing amniotic fluid." },
  { week: 22, size: "Papaya", fact: "Baby's grip, vision, and hearing are improving." },
  { week: 23, size: "Grapefruit", fact: "Lungs are preparing for life outside." },
  { week: 24, size: "Corn", fact: "Baby's taste buds are now fully formed." },
  { week: 25, size: "Cauliflower", fact: "Capillaries are forming and filling with blood." },
  { week: 26, size: "Red Cabbage", fact: "Baby is inhaling and exhaling amniotic fluid." },
  { week: 27, size: "Lettuce", fact: "Baby can open and close their eyes." },
  { week: 28, size: "Eggplant", fact: "Baby may be dreaming now." },
  { week: 29, size: "Acorn Squash", fact: "Brain can now control body temperature." },
  { week: 30, size: "Cucumber", fact: "Baby's eyesight continues to develop." },
  { week: 31, size: "Pineapple", fact: "Baby is having major growth spurts." },
  { week: 32, size: "Squash", fact: "Baby is practicing breathing." },
  { week: 33, size: "Celery", fact: "Baby's immune system is getting a boost." },
  { week: 34, size: "Butternut Squash", fact: "Central nervous system is maturing." },
  { week: 35, size: "Honeydew Melon", fact: "Baby is mostly fully developed now." },
  { week: 36, size: "Romaine Lettuce", fact: "Baby is gaining about an ounce a day." },
  { week: 37, size: "Swiss Chard", fact: "Baby is considered early term." },
  { week: 38, size: "Leek", fact: "Organ systems are ready for the outside world." },
  { week: 39, size: "Watermelon", fact: "Baby is full term and ready to meet you!" },
  { week: 40, size: "Pumpkin", fact: "Happy Birthday! Your wait is almost over." }
];

const getTodayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0');
};

interface DashboardProps {
  onNavigateToRegistry?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRegistry }) => {
  const [metrics, setMetrics] = useState<DateMetrics | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<MedicalRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [userData] = useState<UserType | null>(StorageService.getUserData());
  const [globalImage, setGlobalImage] = useState<string | null>(StorageService.getGlobalProfileImage());
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<DailyInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(StorageService.isQuotaExceeded());
  
  const [waterLogs, setWaterLogs] = useState<MedicalRecord[]>([]);
  const [nutLogs, setNutLogs] = useState<MedicalRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medTakenTimes, setMedTakenTimes] = useState<Record<string, string | null>>({});

  const [selectedMilestoneWeek, setSelectedMilestoneWeek] = useState<number>(1);

  // Medicine Management UI States
  const [isManagingMeds, setIsManagingMeds] = useState(false);
  const [showMedEditor, setShowMedEditor] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [refillingMedId, setRefillingMedId] = useState<string | null>(null);
  const [refillAddQty, setRefillAddQty] = useState(30);

  const [medForm, setMedForm] = useState({
    name: '',
    totalQty: 30,
    schedule: { morning: true, afternoon: false, night: false }
  });

  const fetchInsights = useCallback(async (forceRefresh: boolean = false) => {
    if (!metrics) return;
    
    const week = metrics.weeksPassed + 1;
    const day = metrics.daysPassedRemainder;

    if (!forceRefresh) {
      const cached = StorageService.getCachedInsights(week, day);
      if (cached) {
        setInsights(cached);
        setIsQuotaExhausted(false);
        return;
      }
    }

    if (StorageService.isQuotaExceeded()) {
      setIsQuotaExhausted(true);
      return;
    }

    setIsInsightsLoading(true);
    setIsQuotaExhausted(false);
    
    try {
      const data = await GeminiService.getDailyInsights(week, day);
      
      if (data && 'error' in data && (data as any).status === 429) {
        setIsQuotaExhausted(true);
        setInsights(null);
      } else if (data) {
        const dailyInsights = data as DailyInsights;
        setInsights(dailyInsights);
        StorageService.saveInsightsToCache(week, day, dailyInsights);
        setIsQuotaExhausted(false);
      }
    } catch (err) {
      console.error("Fetch insights error:", err);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [metrics]);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      fetchInsights(true);
    }
  };

  const calculateMetricsForDate = useCallback((dateStr: string) => {
    const start = new Date(START_DATE_STR + 'T12:00:00');
    const due = new Date(DUE_DATE_STR + 'T12:00:00');
    const target = new Date(dateStr + 'T12:00:00');
    
    const totalDuration = due.getTime() - start.getTime();
    const elapsed = Math.max(0, target.getTime() - start.getTime());
    const daysPassedTotal = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    
    const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const weeksPassed = Math.floor(daysPassedTotal / 7);
    const totalDaysLeft = Math.max(0, Math.ceil((due.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)));
    
    setMetrics({
      totalDaysPassed: daysPassedTotal,
      weeksPassed,
      daysPassedRemainder: daysPassedTotal % 7,
      totalDaysLeft,
      weeksLeft: Math.floor(totalDaysLeft / 7),
      daysLeftRemainder: totalDaysLeft % 7,
      progressPercentage: percentage
    });
    setSelectedMilestoneWeek(Math.min(40, Math.max(1, weeksPassed + 1)));
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await StorageService.seedInitialMedicines();
      const records = await StorageService.getRecords();
      
      const relativeEvents = records
        .filter(r => 
          (r.type === RecordType.APPOINTMENT || r.type === RecordType.VACCINATION) &&
          r.date >= selectedDate &&
          r.status !== EventStatus.COMPLETED
        )
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
      setUpcomingEvents(relativeEvents);

      setWaterLogs(await StorageService.getDailyWaterLogs(selectedDate));
      setNutLogs(await StorageService.getDailyNutLogs(selectedDate));

      const meds = await StorageService.getMedicines();
      setMedicines(meds);

      const timesMap: Record<string, string | null> = {};
      for (const med of meds) {
        if (med.schedule.morning) timesMap[`${med.id}_${MedicineSlot.MORNING}`] = await StorageService.getMedicineTakenTime(med.id, MedicineSlot.MORNING, selectedDate);
        if (med.schedule.afternoon) timesMap[`${med.id}_${MedicineSlot.AFTERNOON}`] = await StorageService.getMedicineTakenTime(med.id, MedicineSlot.AFTERNOON, selectedDate);
        if (med.schedule.night) timesMap[`${med.id}_${MedicineSlot.NIGHT}`] = await StorageService.getMedicineTakenTime(med.id, MedicineSlot.NIGHT, selectedDate);
      }
      setMedTakenTimes(timesMap);
      
      calculateMetricsForDate(selectedDate);
      setIsLoading(false);
    } catch (err) {
      console.error("LoadData error:", err);
      setIsLoading(false);
    }
  }, [selectedDate, calculateMetricsForDate]);

  useEffect(() => {
    loadData();
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, [loadData]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setGlobalImage(e.detail || StorageService.getGlobalProfileImage());
    };
    window.addEventListener('koalaProfileUpdate', handleUpdate);
    return () => window.removeEventListener('koalaProfileUpdate', handleUpdate);
  }, []);

  useEffect(() => {
    if (metrics) {
      fetchInsights();
    }
  }, [metrics?.weeksPassed, metrics?.daysPassedRemainder, fetchInsights]);

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.getFullYear() + '-' + 
                    String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(d.getDate()).padStart(2, '0'));
  };

  const handleGlassClick = async (index: number) => {
    if (index < waterLogs.length) {
      await StorageService.deleteRecord(waterLogs[index].id);
    } else if (index === waterLogs.length) {
      await StorageService.addWaterLog(selectedDate);
    }
    await loadData();
  };

  const handleToggleNut = async (item: string) => {
    await StorageService.toggleNutItem(item, selectedDate);
    await loadData();
  };

  const takePill = async (med: Medicine, slot: MedicineSlot) => {
    if (med.totalQty <= 0) return;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    await StorageService.saveMedicine({ ...med, totalQty: med.totalQty - 1 });
    await StorageService.addRecord({
      type: RecordType.MEDICINE,
      title: `${med.name} (${slot})`,
      date: selectedDate,
      time: nowTimeStr,
      details: `Taken at ${nowTimeStr}`,
      medicineId: med.id,
      medicineSlot: slot
    });
    await loadData();
  };

  const saveMed = async () => {
    if (!medForm.name.trim()) return;
    const med: Medicine = {
      id: editingMed ? editingMed.id : StorageService.generateId(),
      name: medForm.name,
      totalQty: medForm.totalQty,
      schedule: medForm.schedule
    };
    await StorageService.saveMedicine(med);
    setShowMedEditor(false);
    setEditingMed(null);
    setMedForm({ name: '', totalQty: 30, schedule: { morning: true, afternoon: false, night: false } });
    await loadData();
  };

  const deleteMed = async (id: string) => {
    if (window.confirm("Remove this medicine from cabinet?")) {
      await StorageService.deleteMedicine(id);
      await loadData();
    }
  };

  const refillMed = async (med: Medicine) => {
    if (refillAddQty <= 0) return;
    const updated = { ...med, totalQty: med.totalQty + refillAddQty };
    await StorageService.saveMedicine(updated);
    setRefillingMedId(null);
    setRefillAddQty(30);
    await loadData();
  };

  const getSlotState = (medId: string, slot: MedicineSlot) => {
    const takenTime = medTakenTimes[`${medId}_${slot}`];
    const isTaken = !!takenTime;
    const isToday = selectedDate === getTodayStr();
    const now = currentTime;
    const currentHour = now.getHours();
    
    let isTime = false;
    let timing = '';
    if (slot === MedicineSlot.MORNING) { 
        isTime = currentHour >= 6 && currentHour < 12; 
        timing = '6 AM - 12 PM';
    } else if (slot === MedicineSlot.AFTERNOON) { 
        isTime = currentHour >= 12 && currentHour < 18; 
        timing = '12 PM - 6 PM';
    } else { 
        isTime = (currentHour >= 18 && currentHour < 24) || (currentHour >= 0 && currentHour < 6); 
        timing = '6 PM - 6 AM';
    }
    
    return { isTaken, takenTime, isTime: isToday ? isTime : true, timing };
  };

  const selectedMilestone = PREGNANCY_MILESTONES.find(m => m.week === selectedMilestoneWeek);

  return (
    <div className="flex flex-col space-y-8 pb-20 animate-fade-in w-full overflow-x-hidden">
      {/* Date Navigation Header */}
      <div className="bg-white/95 backdrop-blur-xl rounded-[28px] px-6 md:px-8 py-5 shadow-sm border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100 shrink-0">
               <Layers size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
               <h3 className="text-base md:text-lg font-black text-gray-800 uppercase tracking-widest leading-none truncate">Daily Tracker</h3>
               <p className="text-[10px] md:text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-tighter truncate">Koala Countdown</p>
            </div>
         </div>
         <div className="flex items-center gap-2 md:gap-4 bg-rose-50/50 p-1.5 rounded-2xl border border-rose-100/30 w-full md:w-auto justify-between md:justify-start">
            <button onClick={() => changeDate(-1)} className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 focus:outline-none shrink-0"><ChevronLeft size={18} className="md:w-22 md:h-22" /></button>
            <div className="px-2 md:px-6 flex flex-col items-center min-w-0 flex-1">
               <span className="text-xs md:text-sm font-black text-gray-800 text-center truncate w-full">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
               <span className="text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5 truncate">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</span>
            </div>
            <button onClick={() => changeDate(1)} className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white border border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 focus:outline-none shrink-0"><ChevronRight size={18} className="md:w-22 md:h-22" /></button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">
        
        {/* Left Section: Baby Status & Insights */}
        <div className="lg:col-span-8 space-y-6 md:y-8 w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
            {/* Pregnancy Milestone Card */}
            <div className="bg-gradient-to-br from-rose-50 to-white rounded-[32px] p-6 border border-rose-100 flex items-center gap-6 shadow-sm relative overflow-hidden group min-h-[160px] md:min-h-[180px] w-full">
               <div className="absolute -right-4 -top-4 text-rose-200/20 rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
                 <Sparkles size={100} />
               </div>
               <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-lg border-4 border-white shrink-0 relative z-10">
                  <div className="flex flex-col items-center">
                     <span className="text-4xl md:text-5xl mb-1">{selectedMilestoneWeek <= 4 ? "🌱" : selectedMilestoneWeek <= 12 ? "👶" : selectedMilestoneWeek <= 24 ? "🤰" : "🧸"}</span>
                     <div className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm">Week {selectedMilestoneWeek}</div>
                  </div>
               </div>
               <div className="relative z-10 min-w-0 flex-1">
                  <h4 className="text-lg md:text-xl font-black text-gray-800 font-heading leading-tight truncate">Size: <span className="text-rose-500 uppercase">{selectedMilestone?.size}</span></h4>
                  <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed italic mt-2 line-clamp-3">"{selectedMilestone?.fact}"</p>
               </div>
            </div>

            {/* AI Insights Summary Card */}
            <div className={`bg-white rounded-[32px] p-6 shadow-sm border flex flex-col gap-4 relative overflow-hidden min-h-[160px] md:min-h-[180px] w-full group transition-all ${isQuotaExhausted ? 'border-rose-100 bg-rose-50/20' : 'border-indigo-50'}`}>
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  {(isQuotaExhausted || StorageService.isQuotaExceeded()) && (
                    <button 
                      onClick={handleSelectKey}
                      className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all active:scale-90 flex items-center gap-1.5 text-[10px] font-bold shadow-lg animate-bounce"
                      title="Update API Key to continue"
                    >
                      <Key size={14} /> Use Personal Key
                    </button>
                  )}
                  <button 
                    onClick={() => fetchInsights(true)} 
                    disabled={isInsightsLoading || (StorageService.isQuotaExceeded() && !insights)}
                    className="p-2 bg-indigo-50 text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all active:scale-90 disabled:opacity-50"
                    title="Refresh Insights"
                  >
                    <RefreshCw size={16} className={isInsightsLoading ? "animate-spin" : ""} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <h4 className="text-rose-400 font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                      <Heart size={14} className="fill-rose-400" /> Baby's Whisper
                    </h4>
                    <div className="Tamil-font text-base font-bold text-rose-800 leading-relaxed italic">
                      {isInsightsLoading ? (
                        <div className="space-y-2">
                           <div className="h-4 w-full bg-rose-50 rounded animate-pulse"></div>
                           <div className="h-4 w-[80%] bg-rose-50 rounded animate-pulse"></div>
                        </div>
                      ) : isQuotaExhausted ? (
                        <div className="text-rose-500 text-[11px] leading-tight flex flex-col gap-1">
                           <span className="font-black flex items-center gap-1"><AlertCircle size={10} /> Quota Exhausted (429)</span>
                           <span>Nursery AI is resting. Use a personal key or check later.</span>
                        </div>
                      ) : (
                        insights?.babyMessage || "குட்டி பாப்பா உங்கள் குரலுக்காக காத்திருக்கிறது!"
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-rose-50 min-w-0">
                    <h4 className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                      <Stethoscope size={14} /> Doctor's Advice
                    </h4>
                    <div className="Tamil-font text-base font-bold text-indigo-800 leading-relaxed italic">
                      {isInsightsLoading ? (
                        <div className="space-y-2">
                           <div className="h-4 w-full bg-indigo-50 rounded animate-pulse"></div>
                           <div className="h-4 w-[60%] bg-indigo-50 rounded animate-pulse"></div>
                        </div>
                      ) : isQuotaExhausted ? (
                        <div className="text-indigo-400 text-[11px]">Medical grounding is paused due to rate limits.</div>
                      ) : (
                        insights?.doctorAdvice || "போதிய ஓய்வும் சத்தான உணவும் அவசியம்."
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Full Insight Panels */}
          {insights && !isInsightsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-in">
                <div className="bg-gradient-to-br from-rose-50/80 to-white p-7 rounded-[40px] border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><MessageCircle size={80} className="text-rose-500" /></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-100"><Heart size={20} className="fill-white" /></div>
                        <h5 className="text-sm font-black uppercase tracking-[0.2em] text-rose-600">Heart to Heart</h5>
                    </div>
                    <p className="Tamil-font text-lg md:text-xl font-bold text-rose-900 leading-relaxed">
                        {insights?.babyMessage}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-rose-300 font-bold text-[10px] uppercase tracking-widest">
                        <Sparkles size={12} /> From your little one
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50/80 to-white p-7 rounded-[40px] border border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Stethoscope size={80} className="text-indigo-500" /></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Stethoscope size={20} /></div>
                        <h5 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Expert Guidance</h5>
                    </div>
                    <p className="Tamil-font text-lg md:text-xl font-bold text-indigo-900 leading-relaxed">
                        {insights?.doctorAdvice}
                    </p>
                    
                    {/* Verified Grounding Sources */}
                    {insights?.sources && insights.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-indigo-50">
                        <h6 className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em] mb-2 flex items-center gap-2">
                           <ExternalLink size={10} /> Verified Sources (from web)
                        </h6>
                        <div className="flex flex-col gap-1.5">
                           {insights.sources.map((source, sidx) => (
                             <a 
                               key={sidx} 
                               href={source.uri} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold flex items-center gap-1 transition-colors truncate"
                             >
                                <ChevronRight size={10} /> {source.title}
                             </a>
                           ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex items-center gap-2 text-indigo-300 font-bold text-[10px] uppercase tracking-widest">
                        <ShieldCheck size={12} /> Grounded Medical Information
                    </div>
                </div>
            </div>
          )}

          {/* Main Progress Card */}
          <div className="bg-gradient-to-br from-rose-500 to-indigo-600 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group w-full">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
             <div className="relative z-10 flex flex-col gap-8 md:gap-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-[20px] md:rounded-3xl flex items-center justify-center border border-white/30 text-3xl md:text-4xl shadow-lg shrink-0 overflow-hidden">
                      {globalImage ? (
                        <img src={globalImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">🐨</span>
                      )}
                    </div>
                    <div className="min-w-0">
                       <h2 className="text-2xl md:text-3xl font-black font-heading leading-none truncate">Hi, {userData?.name}!</h2>
                       <p className="text-rose-100 text-[11px] md:text-sm font-bold tracking-widest mt-2 md:mt-3 uppercase flex items-center gap-2">
                         <Sparkles size={14} className="md:w-4 md:h-4" /> {metrics?.totalDaysLeft} Days Left
                       </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Journey Log</span>
                     <span className="text-2xl md:text-3xl font-black font-heading leading-none mt-1">{metrics?.weeksPassed}w {metrics?.daysPassedRemainder}d</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-6">
                   <div className="bg-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                      <Baby size={18} className="md:w-6 md:h-6 mb-1 md:mb-2 opacity-80" />
                      <span className="text-[8px] md:text-[9px] text-rose-100 uppercase tracking-widest font-black block mb-0.5 md:mb-1">Trimester</span>
                      <span className="text-sm md:text-lg font-black truncate w-full">{metrics && metrics.weeksPassed < 13 ? 'First' : metrics && metrics.weeksPassed < 27 ? 'Second' : 'Third'}</span>
                   </div>
                   <div className="bg-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                      <Calendar size={18} className="md:w-6 md:h-6 mb-1 md:mb-2 opacity-80" />
                      <span className="text-[8px] md:text-[9px] text-rose-100 uppercase tracking-widest font-black block mb-0.5 md:mb-1">Due Date</span>
                      <span className="text-sm md:text-lg font-black truncate w-full">June 1st</span>
                   </div>
                   <div className="bg-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                      <RefreshCw size={18} className="md:w-6 md:h-6 mb-1 md:mb-2 opacity-80" />
                      <span className="text-[8px] md:text-[9px] text-rose-100 uppercase tracking-widest font-black block mb-0.5 md:mb-1">Status</span>
                      <span className="text-sm md:text-lg font-black truncate w-full">{metrics?.progressPercentage?.toFixed(0)}%</span>
                   </div>
                </div>

                <div className="bg-white/10 p-5 md:p-7 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm">
                   <div className="flex justify-between items-end mb-3 md:mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-60">Milestone Progress</span>
                      <span className="text-base md:text-lg font-black tracking-tighter">{metrics?.progressPercentage?.toFixed(1)}%</span>
                   </div>
                   <div className="w-full bg-black/10 h-2.5 md:h-3 rounded-full overflow-hidden p-0">
                      <div className="bg-white h-full rounded-full transition-all duration-1000 shadow-sm" style={{width: `${metrics?.progressPercentage || 0}%`}}></div>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
             {/* Hydration Tracker */}
             <div className="bg-white p-6 rounded-[32px] md:rounded-[40px] shadow-sm border border-sky-100 flex flex-col relative overflow-hidden group w-full">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="min-w-0">
                    <h4 className="font-black text-sky-900 text-[12px] md:text-sm uppercase tracking-widest flex items-center gap-2">
                      <Droplets size={18} className="text-sky-400" /> Hydration
                    </h4>
                    <p className="text-[9px] md:text-[10px] text-sky-400 font-black uppercase mt-1 tracking-widest truncate">{waterLogs.length}/8 Glasses Drunk</p>
                  </div>
                  <div className="bg-sky-50 p-2.5 rounded-xl md:rounded-2xl shadow-inner shrink-0"><Waves size={20} className="md:w-6 md:h-6 text-sky-300 animate-pulse" /></div>
                </div>
                <div className="grid grid-cols-4 gap-3 md:gap-4 flex-1 items-center">
                  {[...Array(8)].map((_, i) => {
                    const log = waterLogs[i];
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleGlassClick(i)} 
                        className={`relative aspect-square rounded-[18px] md:rounded-[24px] border transition-all flex flex-col items-center justify-center overflow-hidden shadow-sm active:scale-95 group/glass ${!!log ? 'bg-gradient-to-br from-sky-400 to-sky-500 border-sky-400 text-white' : i === waterLogs.length ? 'bg-white border-sky-200 border-dashed hover:border-sky-400 hover:bg-sky-50' : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'}`}
                        disabled={i > waterLogs.length}
                      >
                        {!!log ? (
                          <>
                            <Check size={14} md:size={18} strokeWidth={4} className="mb-0.5 md:mb-1" />
                            <span className="text-[8px] md:text-[9px] font-black leading-none uppercase">{log.time}</span>
                          </>
                        ) : (
                          <GlassWater size={22} className={i === waterLogs.length ? 'text-sky-200 group-hover/glass:text-sky-400' : 'text-gray-100'} />
                        )}
                      </button>
                    );
                  })}
                </div>
             </div>

             {/* Superfoods Tracker */}
             <div className="bg-white p-6 rounded-[32px] md:rounded-[40px] shadow-sm border border-amber-100 flex flex-col w-full">
                <h4 className="font-black text-amber-900 text-[12px] md:text-sm mb-6 md:mb-8 uppercase tracking-widest flex items-center gap-2">
                  <Cookie size={18} className="text-amber-500" /> Superfoods
                </h4>
                <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 items-center">
                   {NUT_ITEMS.map((item) => {
                      const log = nutLogs.find(l => l.title === item);
                      const isEaten = !!log;
                      return (
                        <button 
                          key={item} 
                          onClick={() => handleToggleNut(item)} 
                          className={`p-4 md:p-5 rounded-[22px] md:rounded-[28px] border transition-all flex flex-col items-center justify-center text-center min-h-[70px] md:h-[80px] group shadow-sm active:scale-95 ${isEaten ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border-amber-50 text-gray-500 hover:bg-amber-50'}`}
                        >
                           <span className={`text-[11px] md:text-sm font-black leading-none truncate w-full ${isEaten ? 'mb-1.5 md:mb-2' : ''}`}>{item}</span>
                           {isEaten && <div className="flex items-center gap-1 bg-white/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg animate-fade-in"><Clock size={10} /><span className="text-[8px] md:text-[10px] font-black">{log?.time}</span></div>}
                        </button>
                      );
                   })}
                </div>
             </div>
          </div>
        </div>

        {/* Right Section: Medicine Cabinet & Registry Queue */}
        <div className="lg:col-span-4 space-y-6 md:y-8 w-full">
          
          <div className="bg-white p-5 md:p-6 rounded-[32px] md:rounded-[40px] shadow-sm border border-indigo-100 flex flex-col min-h-[450px] md:min-h-[550px] relative w-full overflow-hidden">
             <div className="flex items-center justify-between mb-5 md:mb-6 shrink-0">
               <div className="min-w-0">
                 <h4 className="text-[12px] md:text-sm font-black text-indigo-950 font-heading uppercase tracking-widest flex items-center gap-2">
                   <Pill size={18} className="text-indigo-500" /> Pharmacy
                 </h4>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Nursery Cabinet</p>
               </div>
               <div className="flex gap-1.5">
                 <button 
                  onClick={() => { setEditingMed(null); setMedForm({ name: '', totalQty: 30, schedule: { morning: true, afternoon: false, night: false } }); setShowMedEditor(!showMedEditor); setRefillingMedId(null); }} 
                  className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 ${showMedEditor ? 'bg-rose-500 text-white rotate-180' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                 >
                   {showMedEditor ? <X size={18} /> : <Plus size={18} />}
                 </button>
                 <button 
                  onClick={() => { setIsManagingMeds(!isManagingMeds); setRefillingMedId(null); setShowMedEditor(false); }} 
                  className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 ${isManagingMeds ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
                 >
                   <Settings size={18} />
                 </button>
               </div>
             </div>

             <div className="flex-1 flex flex-col gap-4 relative w-full">
                {showMedEditor ? (
                  <div className="bg-indigo-50/40 p-4 md:p-5 rounded-3xl border border-indigo-100 space-y-4 animate-fade-in text-[11px] w-full">
                    <div className="grid grid-cols-4 gap-3">
                       <div className="col-span-3 space-y-1">
                          <label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Medication</label>
                          <input type="text" placeholder="Name" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} className="w-full px-3 py-2.5 bg-white rounded-xl border border-indigo-100 outline-none font-black shadow-inner" />
                       </div>
                       <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-black uppercase text-indigo-400 ml-1">Stock</label>
                          <input type="number" value={medForm.totalQty} onChange={e => setMedForm({...medForm, totalQty: parseInt(e.target.value) || 0})} className="w-full px-2 py-2.5 bg-white rounded-xl border border-indigo-100 outline-none font-black shadow-inner text-center" />
                       </div>
                    </div>
                    <div className="flex gap-2">
                      {(['morning', 'afternoon', 'night'] as const).map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => setMedForm({...medForm, schedule: {...medForm.schedule, [slot]: !medForm.schedule[slot]}})}
                          className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase transition-all shadow-sm ${medForm.schedule[slot] ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-indigo-100 text-gray-400'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    <button onClick={saveMed} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black uppercase tracking-widest active:scale-[0.97] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                       <Save size={16} /> Save
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 space-y-6 pb-4 w-full overflow-y-auto max-h-[450px] md:max-h-none custom-scrollbar pr-1">
                    {medicines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-200 py-12 opacity-30">
                         <AlertCircle size={40} />
                         <span className="text-[10px] font-black uppercase tracking-widest mt-3">Cabinet Empty</span>
                      </div>
                    ) : (['Morning', 'Afternoon', 'Night'] as MedicineSlot[]).map(slot => {
                      const slotKey = slot.toLowerCase() as 'morning' | 'afternoon' | 'night';
                      const medsInSlot = medicines.filter(m => {
                        if (!m.schedule[slotKey]) return false;
                        const name = m.name.toLowerCase();
                        if (name.includes('folic acid') || name.includes('sustain')) {
                           const startRange = "2025-10-01";
                           const endRange = "2025-12-15";
                           return selectedDate >= startRange && selectedDate <= endRange;
                        }
                        return true;
                      });
                      if (medsInSlot.length === 0) return null;

                      const SlotIcon = slot === MedicineSlot.MORNING ? Sunrise : slot === MedicineSlot.AFTERNOON ? Sun : Moon;

                      return (
                        <div key={slot} className="space-y-2.5 w-full">
                          <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 ml-2 flex items-center gap-2">
                            <SlotIcon size={14} className="opacity-60" /> {slot}
                          </h5>
                          <div className="grid grid-cols-1 gap-2.5 w-full">
                            {medsInSlot.map(med => {
                              const state = getSlotState(med.id, slot);
                              const isLow = med.totalQty <= 5;
                              const isLocked = !state.isTime && !state.isTaken;
                              const isRefilling = refillingMedId === med.id;

                              return (
                                <div key={`${med.id}-${slot}`} className={`px-4 py-3.5 rounded-[24px] border flex flex-col gap-2.5 transition-all relative overflow-hidden shadow-sm w-full ${state.isTaken ? 'bg-emerald-50/40 border-emerald-100' : isLow ? 'bg-rose-50/50 border-rose-100' : 'bg-gray-50/30 border-gray-100 hover:border-indigo-100 hover:bg-white'}`}>
                                  <div className="flex justify-between items-center w-full">
                                    <div className="min-w-0 flex-1 flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-black tracking-tight truncate ${state.isTaken ? 'text-emerald-700 opacity-60' : 'text-indigo-950'}`}>{med.name}</span>
                                        {state.isTaken && <Check size={12} className="text-emerald-500 shrink-0" />}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg shrink-0 ${isLow ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{med.totalQty} Left</span>
                                        {!state.isTaken && <span className="text-[8px] font-bold text-indigo-200 uppercase tracking-tighter truncate">{state.timing}</span>}
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-1 shrink-0 ml-2">
                                      {isManagingMeds ? (
                                        <div className="flex gap-1">
                                          <button onClick={() => { setEditingMed(med); setMedForm({ name: med.name, totalQty: med.totalQty, schedule: med.schedule }); setShowMedEditor(true); }} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg active:scale-90 transition-all"><Edit2 size={14} /></button>
                                          <button onClick={() => deleteMed(med.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-90 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setRefillingMedId(isRefilling ? null : med.id)} className={`p-1.5 rounded-lg transition-all active:scale-90 ${isRefilling ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-200 hover:text-indigo-400'}`}>
                                          <RefreshCw size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {isRefilling ? (
                                    <div className="flex gap-2 animate-fade-in bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-indigo-100 mt-1">
                                      <input type="number" value={refillAddQty} onChange={e => setRefillAddQty(parseInt(e.target.value) || 0)} className="w-12 px-2 text-[10px] font-black outline-none bg-indigo-50/50 rounded-lg text-center" />
                                      <button onClick={() => refillMed(med)} className="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Refill</button>
                                    </div>
                                  ) : (
                                    <button 
                                      disabled={state.isTaken || isLocked || med.totalQty <= 0} 
                                      onClick={() => takePill(med, slot)} 
                                      className={`py-2 rounded-[18px] border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${state.isTaken ? 'bg-emerald-500/10 border-emerald-100 text-emerald-600 cursor-default' : isLocked ? 'bg-gray-50/10 border-gray-50 text-gray-200' : 'bg-white border-indigo-100 text-indigo-500 hover:border-indigo-400'}`}
                                    >
                                      {state.isTaken ? `Taken at ${state.takenTime}` : 'Take Dose'}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-7 shadow-sm border border-rose-100 flex flex-col h-[400px] md:h-[480px] w-full overflow-hidden">
              <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
                <h3 className="font-black text-gray-800 font-heading text-[12px] md:text-xs uppercase tracking-widest flex items-center gap-3">
                  <CalendarCheck size={20} className="text-rose-400" /> Registry Queue
                </h3>
                <button onClick={onNavigateToRegistry} className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 shrink-0"><Plus size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 custom-scrollbar pr-1 md:pr-3 w-full">
                  {isLoading ? <div className="text-center py-12 md:py-16 text-gray-300 animate-pulse text-[10px] md:text-xs font-black uppercase tracking-widest">Scanning History...</div> : upcomingEvents.length === 0 ? <div className="text-center py-20 md:py-24 text-gray-300 text-[10px] md:text-xs font-black italic uppercase tracking-widest opacity-60">Nothing pinned for today</div> : upcomingEvents.map(event => (
                      <div key={event.id} className="group relative bg-white p-4 md:p-5 rounded-[24px] md:rounded-[32px] border border-gray-100 flex items-center gap-4 md:gap-6 transition-all hover:border-rose-200 w-full overflow-hidden">
                          <div className={`w-2 absolute left-1 top-4 bottom-4 rounded-full ${event.type === RecordType.APPOINTMENT ? 'bg-blue-400' : 'bg-purple-400'} shrink-0`}></div>
                          <div className={`w-12 h-14 md:w-14 md:h-16 shrink-0 flex flex-col items-center justify-center rounded-xl md:rounded-2xl ${event.type === RecordType.APPOINTMENT ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600 shadow-sm'}`}>
                             <span className="text-[8px] md:text-[10px] font-black uppercase opacity-60 leading-none">{new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                             <span className="text-xl md:text-2xl font-black leading-none mt-1.5 md:mt-2">{new Date(event.date + 'T12:00:00').getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs md:text-sm font-black text-gray-800 leading-tight truncate">{event.title}</p>
                             <div className="flex items-center gap-2 md:gap-3 mt-2 text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                {event.time && <span className="flex items-center gap-1.5 shrink-0"><Clock size={14} /> {event.time}</span>}
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
