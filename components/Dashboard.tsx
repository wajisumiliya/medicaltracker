import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Baby, Bell, BellRing, Plus, X, CalendarCheck, Droplets, Cookie, Pill, Frown, CheckCircle2, Moon, Sun, Trash2, Edit2, AlertCircle, Check, GlassWater, User, Sparkles, Activity, Scale, HeartPulse, Eye } from 'lucide-react';
import { DateMetrics, MedicalRecord, Medicine, MedicineSlot, RecordType, User as UserType } from '../types';
import { NotificationService } from '../services/notifications';
import { StorageService } from '../services/storage';

// Constants defined by requirements
const START_DATE_STR = "2025-08-28"; 
const DUE_DATE_STR = "2026-06-01";

// Nut Configuration
const NUT_ITEMS = ['Almonds', 'Walnuts', 'Seeds', 'Dates'];

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DateMetrics | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<MedicalRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Daily Habit States
  const [waterLogs, setWaterLogs] = useState<MedicalRecord[]>([]); // Array of logs
  const [nutItems, setNutItems] = useState<string[]>([]);
  const [vomitCount, setVomitCount] = useState(0);

  // Health Stats
  const [latestWeight, setLatestWeight] = useState<string>('-- kg');
  const [latestBP, setLatestBP] = useState<string>('--/--');

  // Medicine State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  
  // Med Status Map for UI
  const [medTakenStatus, setMedTakenStatus] = useState<Record<string, boolean>>({});
  
  // Med Modal Form
  const [medName, setMedName] = useState('');
  const [medQty, setMedQty] = useState('');
  const [medMorning, setMedMorning] = useState(false);
  const [medNight, setMedNight] = useState(false);

  // Quick Add Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<RecordType>(RecordType.APPOINTMENT);

  // Helper: Safe Date Formatting
  const formatDateSafe = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Error';
    }
  };

  // Helper: Calculate Trimester
  const getTrimester = (weeks: number) => {
    if (weeks < 13) return '1st Trimester';
    if (weeks < 27) return '2nd Trimester';
    return '3rd Trimester';
  };

  // Helper: Baby Size approximation
  const getBabySize = (weeks: number) => {
    if (weeks < 4) return 'Microscopic';
    if (weeks < 5) return 'Poppy Seed';
    if (weeks < 6) return 'Sesame Seed';
    if (weeks < 7) return 'Lentil';
    if (weeks < 8) return 'Blueberry';
    if (weeks < 9) return 'Kidney Bean';
    if (weeks < 10) return 'Grape';
    if (weeks < 11) return 'Kumquat';
    if (weeks < 12) return 'Fig';
    if (weeks < 13) return 'Lime';
    if (weeks < 14) return 'Lemon';
    if (weeks < 16) return 'Apple';
    if (weeks < 18) return 'Bell Pepper';
    if (weeks < 20) return 'Banana';
    if (weeks < 24) return 'Ear of Corn';
    if (weeks < 28) return 'Eggplant';
    if (weeks < 32) return 'Squash';
    if (weeks < 36) return 'Honeydew';
    if (weeks < 40) return 'Pumpkin';
    return 'Watermelon';
  };

  const loadData = async () => {
    const records = await StorageService.getRecords();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Reminders
    const upcoming = records
      .filter(r => 
        (r.type === RecordType.APPOINTMENT || r.type === RecordType.VACCINATION) &&
        r.date >= todayStr
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
    setUpcomingEvents(upcoming);

    // Habits
    setWaterLogs(await StorageService.getDailyWaterLogs(todayStr));
    setNutItems(await StorageService.getDailyNutItems(todayStr));
    setVomitCount(await StorageService.getDailyCount(RecordType.VOMIT, todayStr));

    // Latest Vitals
    const weightRecord = records.filter(r => r.type === RecordType.GROWTH).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (weightRecord && weightRecord.value) setLatestWeight(weightRecord.value);

    const bpRecord = records.filter(r => r.type === RecordType.VITALS).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (bpRecord && bpRecord.value) setLatestBP(bpRecord.value);

    // Medicines
    const meds = await StorageService.getMedicines();
    setMedicines(meds);

    // Build Med Status Map
    const statusMap: Record<string, boolean> = {};
    for (const med of meds) {
      if (med.schedule.morning) {
        statusMap[`${med.id}_${MedicineSlot.MORNING}`] = await StorageService.isMedicineTakenToday(med.id, MedicineSlot.MORNING);
      }
      if (med.schedule.night) {
        statusMap[`${med.id}_${MedicineSlot.NIGHT}`] = await StorageService.isMedicineTakenToday(med.id, MedicineSlot.NIGHT);
      }
    }
    setMedTakenStatus(statusMap);
    
    // User
    setUserData(StorageService.getUserData());
    setIsLoading(false);
  };

  useEffect(() => {
    // 1. Calculate Metrics
    const calculateMetrics = () => {
      const start = new Date(START_DATE_STR);
      const due = new Date(DUE_DATE_STR);
      const now = new Date();

      const totalDuration = due.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      const safeElapsed = Math.max(0, elapsed);
      const daysPassedTotal = Math.floor(safeElapsed / (1000 * 60 * 60 * 24));
      
      const weeksPassed = Math.floor(daysPassedTotal / 7);
      const daysPassedRemainder = daysPassedTotal % 7;

      const timeLeft = due.getTime() - now.getTime();
      const daysLeftTotal = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.floor(daysLeftTotal / 7);
      const daysLeftRemainder = daysLeftTotal % 7;

      const percentage = Math.min(100, Math.max(0, (safeElapsed / totalDuration) * 100));

      setMetrics({
        totalDaysPassed: daysPassedTotal,
        weeksPassed,
        daysPassedRemainder,
        totalDaysLeft: daysLeftTotal,
        weeksLeft,
        daysLeftRemainder,
        progressPercentage: percentage
      });
    };

    calculateMetrics();
    loadData();

    // 2. Timer & Notifications Check
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      calculateMetrics();
      NotificationService.checkReminders();
    }, 1000 * 60);

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    NotificationService.getPermissionStatus() === 'granted' && setNotificationsEnabled(true);

    return () => {
      clearInterval(timer);
      clearInterval(clockTimer);
    };
  }, []);

  const requestNotificationPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationsEnabled(granted);
  };

  // --- Handlers (Add/Edit/Delete) ---
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;
    await StorageService.addRecord({
      type: newEventType,
      title: newEventTitle,
      date: newEventDate,
      details: 'Added via Dashboard Quick Add'
    });
    setNewEventTitle('');
    setNewEventDate('');
    setShowAddModal(false);
    loadData();
  };

  const handleAddWater = async () => {
    await StorageService.addWaterLog();
    loadData();
  };

  const handleGlassClick = async (index: number) => {
    // index is 0-7, representing the 1st through 8th glass.
    if (index < waterLogs.length) {
        // Log exists -> Remove it
        const logToRemove = waterLogs[index];
        await StorageService.deleteRecord(logToRemove.id);
        loadData();
        return;
    }
    // Log doesn't exist -> Add it
    if (index === waterLogs.length) {
        await StorageService.addWaterLog();
        loadData();
    }
  };

  const handleToggleNut = async (item: string) => {
    await StorageService.toggleNutItem(item);
    loadData();
  };

  const handleAddVomit = async () => {
    await StorageService.addRecord({
      type: RecordType.VOMIT,
      title: 'Vomiting Incident',
      date: new Date().toISOString().split('T')[0],
      details: `Logged at ${new Date().toLocaleTimeString()}`,
      value: '1'
    });
    loadData();
  };

  const handleMedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medicine = {
      id: editingMed ? editingMed.id : StorageService.generateId(),
      name: medName,
      totalQty: parseInt(medQty) || 0,
      schedule: { morning: medMorning, night: medNight }
    };
    await StorageService.saveMedicine(newMed);
    setShowMedModal(false);
    resetMedForm();
    loadData();
  };

  const handleEditMed = (med: Medicine) => {
    setEditingMed(med);
    setMedName(med.name);
    setMedQty(med.totalQty.toString());
    setMedMorning(med.schedule.morning);
    setMedNight(med.schedule.night);
    setShowMedModal(true);
  };

  const handleDeleteMedicine = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this medicine? This will also remove all associated usage history.')) {
        await StorageService.deleteMedicine(id);
        loadData();
    }
  };

  const resetMedForm = () => {
    setEditingMed(null);
    setMedName('');
    setMedQty('');
    setMedMorning(false);
    setMedNight(false);
  };

  const takePill = async (med: Medicine, slot: MedicineSlot) => {
    const updatedMed = { ...med, totalQty: med.totalQty - 1 };
    await StorageService.saveMedicine(updatedMed);
    await StorageService.addRecord({
      type: RecordType.MEDICINE,
      title: `${med.name} (${slot})`,
      date: new Date().toISOString().split('T')[0],
      details: `Taken at ${new Date().toLocaleTimeString()}`,
      medicineId: med.id,
      medicineSlot: slot
    });
    loadData();
  };

  const getSlotState = (medId: string, slot: MedicineSlot) => {
    const isTaken = medTakenStatus[`${medId}_${slot}`] || false;
    const now = currentTime; // Use state for live updates
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let isTime = false;
    let windowText = "";
    let progress = 0;

    if (slot === MedicineSlot.MORNING) {
      // 10:00 AM - 12:00 PM
      const start = 10 * 60; // 600
      const end = 12 * 60;   // 720
      windowText = "10:00 AM - 12:00 PM";
      isTime = currentMinutes >= start && currentMinutes < end;
      if (isTime) {
         progress = ((currentMinutes - start) / (end - start)) * 100;
      }
    } else {
      // 8:00 PM - 11:59 PM
      const start = 20 * 60; // 1200
      const end = 23 * 60 + 59; // 1439
      windowText = "8:00 PM - 11:59 PM";
      isTime = currentMinutes >= start;
      if (isTime) {
         progress = ((currentMinutes - start) / (end - start)) * 100;
      }
    }
    return { isTaken, isTime, windowText, progress };
  };

  // Calculate overall daily score
  const calculateDailyScore = () => {
      const waterScore = Math.min(1, waterLogs.length / 8);
      const nutScore = Math.min(1, nutItems.length / 4);
      
      // Med Score
      let takenMeds = 0;
      let totalSlots = 0;
      medicines.forEach(m => {
          if (m.schedule.morning) {
              totalSlots++;
              if (medTakenStatus[`${m.id}_${MedicineSlot.MORNING}`]) takenMeds++;
          }
          if (m.schedule.night) {
              totalSlots++;
              if (medTakenStatus[`${m.id}_${MedicineSlot.NIGHT}`]) takenMeds++;
          }
      });
      const medScore = totalSlots === 0 ? 1 : takenMeds / totalSlots;

      return Math.round(((waterScore + nutScore + medScore) / 3) * 100);
  };

  const dailyScore = calculateDailyScore();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Admin Monitoring Banner */}
      {userData?.role === 'admin' && (
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg"><Eye size={20} /></div>
                <div>
                    <p className="text-sm font-bold">Admin View Active</p>
                    <p className="text-xs text-indigo-200">You are viewing Sumaiya's medical records</p>
                </div>
            </div>
            <span className="text-xs font-mono bg-indigo-800 px-2 py-1 rounded">READ/WRITE ACCESS</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NEW PROFILE SECTION */}
        <div className="lg:col-span-2 bg-gradient-to-br from-rose-400 to-indigo-400 rounded-[32px] p-6 text-white shadow-xl shadow-rose-200/50 relative overflow-hidden flex flex-col justify-between">
           <div className="relative z-10 flex flex-col md:flex-row gap-6 h-full">
              {/* Profile Details */}
              <div className="flex-1">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 text-3xl shadow-lg">
                       🐨
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold font-heading">Hi, {userData?.role === 'admin' ? 'Wajeeth' : 'Sumaiya'}!</h2>
                       <p className="text-rose-100 text-sm font-medium flex items-center gap-1">
                          <Baby size={14} /> {userData?.role === 'admin' ? 'Dad-to-be' : 'Expecting Mom'}
                       </p>
                    </div>
                 </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                     <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-xs text-rose-100 uppercase tracking-wider font-bold block mb-1">Trimester</span>
                        <span className="text-base font-bold truncate">{metrics ? getTrimester(metrics.weeksPassed) : 'Loading...'}</span>
                     </div>
                     <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-xs text-rose-100 uppercase tracking-wider font-bold block mb-1">Baby Size</span>
                        <span className="text-base font-bold truncate">{metrics ? getBabySize(metrics.weeksPassed) : '...'}</span>
                     </div>
                     <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-xs text-rose-100 uppercase tracking-wider font-bold block mb-1 flex items-center gap-1"><Scale size={10} /> Weight</span>
                        <span className="text-base font-bold truncate">{latestWeight}</span>
                     </div>
                     <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <span className="text-xs text-rose-100 uppercase tracking-wider font-bold block mb-1 flex items-center gap-1"><HeartPulse size={10} /> BP</span>
                        <span className="text-base font-bold truncate">{latestBP}</span>
                     </div>
                 </div>

                 <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-end mb-1">
                        <div>
                           <span className="text-4xl font-bold font-heading">{metrics?.weeksPassed}</span>
                           <span className="text-sm font-medium opacity-80 ml-1">Weeks</span>
                        </div>
                        <span className="text-xl font-bold opacity-90">{metrics?.daysPassedRemainder} Days</span>
                    </div>
                    <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                       <div className="bg-white h-full rounded-full transition-all duration-1000" style={{width: `${metrics?.progressPercentage || 0}%`}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-rose-100">
                       <span>Start: Aug 28, 2025</span>
                       <span>Due: Jun 01, 2026</span>
                    </div>
                 </div>
              </div>

              {/* Stats Summary Panel */}
              <div className="md:w-64 bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex flex-col justify-between">
                 <div className="text-center mb-4 relative">
                     {/* Circular Progress Placeholder - Visual only for now */}
                     <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center mx-auto relative">
                        <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin-slow opacity-30"></div>
                        <div>
                            <span className="text-3xl font-bold font-heading">{dailyScore}%</span>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Daily Goal</p>
                        </div>
                     </div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2 text-sky-100"><GlassWater size={14} /> Water</div>
                       <span className="font-mono font-bold">{waterLogs.length}/8</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2 text-amber-100"><Cookie size={14} /> Nuts</div>
                       <span className="font-mono font-bold">{nutItems.length}/4</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2 text-indigo-100"><Pill size={14} /> Meds</div>
                       <span className="font-mono font-bold text-[10px] bg-white/20 px-1.5 py-0.5 rounded">CHECK</span>
                    </div>
                 </div>
                 
                 <div className="mt-4 pt-3 border-t border-white/10 text-center">
                    <p className="text-2xl font-mono font-bold">
                       {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs opacity-75">{currentTime.toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
           
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        </div>

        {/* Reminders & Quick Actions */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 font-heading">Reminders</h3>
                <button 
                  onClick={requestNotificationPermission}
                  className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                >
                  {notificationsEnabled ? <BellRing size={20} /> : <Bell size={20} />}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center py-4 text-gray-400">Loading...</div>
                ) : upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No upcoming events
                    </div>
                ) : (
                    upcomingEvents.map(event => (
                        <div key={event.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-start gap-3">
                            <div className="mt-0.5 min-w-[4px] h-8 bg-rose-400 rounded-full"></div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{event.title}</p>
                                <p className="text-xs text-rose-500 font-medium">
                                    {formatDateSafe(event.date)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 border-2 border-dashed border-rose-200 text-rose-400 rounded-xl font-bold hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={18} /> Quick Add
            </button>
        </div>
      </div>

      {/* 2. Habits Grid */}
      <h3 className="text-xl font-bold text-gray-800 font-heading px-2">Daily Habits</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Water Card - INTERACTIVE GRID */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-sky-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
                <h4 className="font-bold text-sky-900 flex items-center gap-2">
                   <Droplets size={18} className="text-sky-500" /> Hydration
                </h4>
                <p className="text-xs text-sky-400 font-medium mt-1">Goal: 8 Glasses</p>
             </div>
             {/* Simple count display */}
             <div className="text-2xl font-bold text-sky-500 font-mono">
                {waterLogs.length}/8
             </div>
          </div>
          
          {/* 8 Glasses Grid Visualization */}
          <div className="grid grid-cols-4 gap-3 my-4 relative z-10">
              {[...Array(8)].map((_, i) => {
                  const isTaken = i < waterLogs.length;
                  // If taken, get the log for this slot
                  const log = isTaken ? waterLogs[i] : null;
                  const timeStr = log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
                  const isDisabled = i > waterLogs.length; // Can only toggle current or next

                  return (
                    <button 
                        key={i} 
                        onClick={() => handleGlassClick(i)}
                        disabled={isDisabled}
                        title={isTaken ? `Taken at ${timeStr}` : 'Log Water'}
                        className={`
                            aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative border-2
                            ${isTaken 
                                ? 'bg-sky-100 border-sky-200 text-sky-600 shadow-inner' 
                                : isDisabled 
                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-60'
                                    : 'bg-white border-sky-100 text-sky-300 hover:border-sky-300 hover:text-sky-400 hover:shadow-md cursor-pointer hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        <GlassWater size={24} className={isTaken ? 'fill-sky-400 text-sky-500 mb-1' : ''} strokeWidth={isTaken ? 1.5 : 2} />
                        {isTaken ? (
                            <span className="px-2 py-0.5 bg-white/60 rounded-full text-[10px] font-bold font-mono text-sky-700 shadow-sm backdrop-blur-sm border border-sky-100/50">
                                {timeStr}
                            </span>
                        ) : (
                             !isDisabled && <Plus size={14} className="opacity-60 absolute top-2 right-2" />
                        )}
                    </button>
                  );
              })}
          </div>
          
          <p className="text-xs text-center text-gray-400 italic mt-2">Tap a glass to log. Tap filled glass to undo.</p>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-50 rounded-full blur-3xl"></div>
        </div>

        {/* Nuts Card */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-amber-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="mb-4">
              <h4 className="font-bold text-amber-900 flex items-center gap-2">
                 <Cookie size={18} className="text-amber-500" /> Daily Nuts
              </h4>
              <p className="text-xs text-amber-500/60 font-medium mt-1">Target: All 4 Items</p>
           </div>
           <div className="space-y-3 relative z-10">
              {NUT_ITEMS.map((item) => {
                 const isEaten = nutItems.includes(item);
                 return (
                   <button
                     key={item}
                     onClick={() => handleToggleNut(item)}
                     className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${isEaten ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-white border-gray-100 text-gray-500 hover:bg-amber-50'}`}
                   >
                      <span className="text-sm font-bold">{item}</span>
                      {isEaten ? <CheckCircle2 size={18} className="text-amber-600" /> : <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-200"></div>}
                   </button>
                 );
              })}
           </div>
           <div className="mt-4 flex items-center gap-2">
               <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(nutItems.length / 4) * 100}%` }}></div>
               </div>
               <span className="text-xs font-bold text-amber-500">{nutItems.length}/4</span>
           </div>
        </div>

        {/* Vomit Tracker */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-rose-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="flex justify-between items-start mb-6">
              <h4 className="font-bold text-rose-900 flex items-center gap-2">
                 <Frown size={18} className="text-rose-500" /> Vomit
              </h4>
              <button onClick={handleAddVomit} className="w-8 h-8 bg-rose-100 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-200 transition-colors">
                 <Plus size={16} />
               </button>
           </div>
           <div className="flex flex-col items-center justify-center py-4">
              <span className="text-5xl font-bold text-rose-500 mb-2">{vomitCount}</span>
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Incidents Today</p>
           </div>
        </div>
      </div>

      {/* 3. Medicine Cabinet */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
           <h3 className="text-xl font-bold text-gray-800 font-heading">Medicine Cabinet</h3>
           <button 
             onClick={() => { resetMedForm(); setShowMedModal(true); }}
             className="text-sm font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
           >
             <Plus size={16} /> Manage
           </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {medicines.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
               <p className="text-gray-400">No medicines configured.</p>
               <button onClick={() => setShowMedModal(true)} className="text-indigo-500 font-bold mt-2 text-sm hover:underline">Add Medicine</button>
            </div>
          ) : (
            medicines.map((med) => {
              const morningState = getSlotState(med.id, MedicineSlot.MORNING);
              const nightState = getSlotState(med.id, MedicineSlot.NIGHT);
              const isLowStock = med.totalQty <= 0;

              return (
                <div key={med.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${isLowStock ? 'border-red-200 bg-red-50/30' : 'border-indigo-100'}`}>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-indigo-500 ${isLowStock ? 'bg-red-100 text-red-500' : 'bg-indigo-50'}`}>
                           <Pill size={24} />
                         </div>
                         <div>
                            <h4 className="text-lg font-bold text-gray-800 font-heading">{med.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLowStock ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                                Stock: {med.totalQty}
                              </span>
                              {isLowStock && <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><AlertCircle size={10} /> REFILL NEEDED</span>}
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleEditMed(med)} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                         <button onClick={(e) => handleDeleteMedicine(e, med.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {med.schedule.morning && (
                        <button
                          disabled={!morningState.isTime || morningState.isTaken || isLowStock}
                          onClick={() => takePill(med, MedicineSlot.MORNING)}
                          className={`
                            relative py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all min-h-[80px] overflow-hidden
                            ${morningState.isTaken 
                               ? 'bg-green-50 border-green-200 text-green-700 opacity-60' 
                               : (!morningState.isTime || isLowStock)
                                  ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-white border-indigo-100 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'
                            }
                          `}
                        >
                           {/* Progress Bar for Time Window */}
                           {morningState.isTime && !morningState.isTaken && (
                               <div className="absolute bottom-0 left-0 h-1 bg-indigo-200 w-full">
                                   <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${morningState.progress}%` }}></div>
                               </div>
                           )}

                          <div className="flex items-center gap-2 mb-1 z-10">
                             <Sun size={16} /> <span className="font-bold text-sm">Morning</span>
                          </div>
                          {morningState.isTaken ? (
                             <span className="text-xs font-bold flex items-center gap-1"><Check size={12}/> TAKEN</span>
                          ) : (
                             <>
                               <span className="text-xs font-medium z-10">{morningState.windowText}</span>
                               <span className="text-[10px] uppercase font-bold mt-1 opacity-80 z-10">{(!morningState.isTime && !isLowStock) ? 'LOCKED' : isLowStock ? 'NO STOCK' : 'TAKE PILL'}</span>
                             </>
                          )}
                        </button>
                      )}

                      {med.schedule.night && (
                        <button
                          disabled={!nightState.isTime || nightState.isTaken || isLowStock}
                          onClick={() => takePill(med, MedicineSlot.NIGHT)}
                          className={`
                            relative py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all min-h-[80px] overflow-hidden
                            ${nightState.isTaken 
                               ? 'bg-green-50 border-green-200 text-green-700 opacity-60' 
                               : (!nightState.isTime || isLowStock)
                                  ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md shadow-indigo-200'
                            }
                          `}
                        >
                           {/* Progress Bar for Time Window */}
                           {nightState.isTime && !nightState.isTaken && (
                               <div className="absolute bottom-0 left-0 h-1 bg-indigo-400 w-full">
                                   <div className="h-full bg-indigo-200 transition-all duration-1000" style={{ width: `${nightState.progress}%` }}></div>
                               </div>
                           )}

                           <div className="flex items-center gap-2 mb-1 z-10">
                             <Moon size={16} /> <span className="font-bold text-sm">Night</span>
                          </div>
                          {nightState.isTaken ? (
                             <span className="text-xs font-bold flex items-center gap-1"><Check size={12}/> TAKEN</span>
                          ) : (
                             <>
                               <span className="text-xs font-medium opacity-80 z-10">{nightState.windowText}</span>
                               <span className="text-[10px] uppercase font-bold mt-1 opacity-90 z-10">{(!nightState.isTime && !isLowStock) ? 'LOCKED' : isLowStock ? 'NO STOCK' : 'TAKE PILL'}</span>
                             </>
                          )}
                        </button>
                      )}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl animate-scale-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Quick Add Event</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                </div>
                <form onSubmit={handleQuickAdd} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Event Title</label>
                        <input type="text" required value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none transition-all" placeholder="e.g., Ultrasound Scan" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input type="date" required value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none transition-all" />
                    </div>
                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                         <div className="grid grid-cols-2 gap-2 mt-1">
                            <button type="button" onClick={() => setNewEventType(RecordType.APPOINTMENT)} className={`p-2 rounded-lg text-sm font-bold border ${newEventType === RecordType.APPOINTMENT ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Appointment</button>
                            <button type="button" onClick={() => setNewEventType(RecordType.VACCINATION)} className={`p-2 rounded-lg text-sm font-bold border ${newEventType === RecordType.VACCINATION ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Vaccination</button>
                         </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200">Save Event</button>
                </form>
            </div>
        </div>
      )}

      {/* Medicine Modal */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl animate-scale-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">{editingMed ? 'Edit Medicine' : 'Add New Medicine'}</h3>
                    <button onClick={() => { setShowMedModal(false); resetMedForm(); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                </div>
                <form onSubmit={handleMedSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Medicine Name</label>
                        <input type="text" required value={medName} onChange={e => setMedName(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all" placeholder="e.g., Iron Supplement" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Total Stock (Tablets)</label>
                        <input type="number" required value={medQty} onChange={e => setMedQty(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all" placeholder="0" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Schedule</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${medMorning ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                                <input type="checkbox" checked={medMorning} onChange={e => setMedMorning(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-200" />
                                <span className="text-sm font-bold text-gray-700">Morning</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${medNight ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                                <input type="checkbox" checked={medNight} onChange={e => setMedNight(e.target.checked)} className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-200" />
                                <span className="text-sm font-bold text-gray-700">Night</span>
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200">
                        {editingMed ? 'Update Medicine' : 'Add to Cabinet'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* CheckCircle2 import fix placeholder (Lucide exports CheckCircle2, just ensuring usages align) */}
      <div className="hidden">
         {/* Hidden dummy to ensure tailwind classes generated if needed dynamically */}
      </div>
    </div>
  );
};

// Helper for check icon
const CheckCircle2 = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);