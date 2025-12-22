
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, CalendarCheck, Syringe, NotebookPen, X, Search, 
  AlertCircle, Edit3, Save, Clock, MapPin, ChevronRight, CheckCircle2,
  Sparkles, Scale, ChevronLeft, XCircle, Loader2
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { MedicalRecord, RecordType, EventStatus } from '../types';

interface MedicalLogProps {
  onBackToDashboard?: () => void;
}

export const MedicalLog: React.FC<MedicalLogProps> = ({ onBackToDashboard }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states
  const [type, setType] = useState<RecordType>(RecordType.NOTE);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [status, setStatus] = useState<EventStatus>(EventStatus.PENDING);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const data = await StorageService.getRecords();
    setRecords(data);
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Exclude habit-based records from the registry view unless specifically filtered
      if (record.type === RecordType.WATER || record.type === RecordType.NUTS || record.type === RecordType.MEDICINE) return false;
      const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (record.details && record.details.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || record.type === filterType;
      const matchesDate = (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate);
      return matchesSearch && matchesType && matchesDate;
    });
  }, [records, searchQuery, filterType, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isMedicalEvent = (type === RecordType.APPOINTMENT || type === RecordType.VACCINATION);
    const recordData = { 
      type, 
      title: type === RecordType.WEIGHT ? `Weight Check: ${value}kg` : title, 
      details, 
      location,
      value: type === RecordType.WEIGHT ? value : undefined,
      date, 
      time,
      status: isMedicalEvent ? status : undefined
    };

    if (editingId) {
      await StorageService.updateRecord({ id: editingId, ...recordData } as MedicalRecord);
    } else {
      await StorageService.addRecord(recordData);
    }
    
    await fetchRecords();
    setIsAdding(false);
    setEditingId(null);
    resetForm();
    
    if (onBackToDashboard && !editingId) onBackToDashboard();
  };

  const handleStatusUpdate = async (record: MedicalRecord, newStatus: EventStatus) => {
    const updated = { ...record, status: newStatus };
    await StorageService.updateRecord(updated);
    // Local state update for immediate feedback
    setRecords(prev => prev.map(r => r.id === record.id ? updated : r));
  };

  const handleCancel = () => {
    if (editingId) {
      setEditingId(null);
      setIsAdding(false);
      resetForm();
    } else {
      if (onBackToDashboard) onBackToDashboard();
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingId(record.id);
    setType(record.type);
    setTitle(record.title);
    setDetails(record.details || '');
    setLocation(record.location || '');
    setValue(record.value || '');
    setDate(record.date);
    setTime(record.time || '');
    setStatus(record.status || EventStatus.PENDING);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await StorageService.deleteRecord(id);
      await fetchRecords();
    }
  };

  const resetForm = () => {
    setTitle(''); 
    setDetails(''); 
    setLocation('');
    setValue('');
    setType(RecordType.NOTE);
    setEditingId(null);
    setStatus(EventStatus.PENDING);
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  const getTypeStyle = (rt: RecordType) => {
    switch (rt) {
      case RecordType.APPOINTMENT: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <CalendarCheck size={18} /> };
      case RecordType.VACCINATION: return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: <Syringe size={18} /> };
      case RecordType.VOMIT: return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: <AlertCircle size={18} /> };
      case RecordType.SYMPTOM: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: <Sparkles size={18} /> };
      case RecordType.WEIGHT: return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <Scale size={18} /> };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: <NotebookPen size={18} /> };
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case EventStatus.COMPLETED:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase"><CheckCircle2 size={10} /> Completed</span>;
      case EventStatus.MISSED:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase"><XCircle size={10} /> Missed</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase"><Clock size={10} /> Pending</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <div className="flex flex-col gap-4">
        {onBackToDashboard && (
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-colors w-fit"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
        )}
        <div className="flex items-center justify-between">
          <div>
              <h2 className="text-3xl font-bold text-gray-800 font-heading tracking-tight">Medical Registry</h2>
              <p className="text-sm text-gray-400 font-medium">Documenting your miracle, step by step.</p>
          </div>
          <button 
            onClick={() => {
              if (isAdding) { handleCancel(); }
              else { setIsAdding(true); }
            }} 
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 font-bold ${isAdding ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200'}`}
          >
            {isAdding ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Event</>}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] shadow-2xl shadow-rose-100/20 border border-rose-50 space-y-6 animate-fade-in relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                {editingId ? <Edit3 className="text-rose-500" /> : <Plus className="text-rose-500" />}
                {editingId ? 'Modify Event' : 'New Medical Event'}
              </h3>
              <button 
                type="button"
                onClick={handleCancel}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Category</label>
                 <select value={type} onChange={e => setType(e.target.value as RecordType)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none cursor-pointer">
                    <option value={RecordType.NOTE}>General Note</option>
                    <option value={RecordType.APPOINTMENT}>Appointment</option>
                    <option value={RecordType.VACCINATION}>Vaccination</option>
                    <option value={RecordType.SYMPTOM}>Symptom Check</option>
                    <option value={RecordType.VOMIT}>Vomit Incident</option>
                    <option value={RecordType.WEIGHT}>Weight Entry</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Time</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none" />
                 </div>
              </div>
           </div>

           {type === RecordType.WEIGHT ? (
             <div className="space-y-2 animate-fade-in">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Weight (kg)</label>
               <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} required placeholder="e.g. 65.5" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none" />
               </div>
             </div>
           ) : (
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Monthly OB/GYN Visit" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none" />
             </div>
           )}

           {(type === RecordType.APPOINTMENT || type === RecordType.VACCINATION) && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Location</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Hospital, Clinic, or Online" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Status</label>
                   <select value={status} onChange={e => setStatus(e.target.value as EventStatus)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none cursor-pointer">
                      <option value={EventStatus.PENDING}>Pending</option>
                      <option value={EventStatus.COMPLETED}>Completed</option>
                      <option value={EventStatus.MISSED}>Missed</option>
                   </select>
                </div>
             </div>
           )}

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Observations & Notes</label>
              <textarea rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="Enter findings, prescriptions, or feelings..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-medium text-gray-700 focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all border-none resize-none" />
           </div>

           <div className="flex gap-4">
              <button 
                type="button" 
                onClick={handleCancel}
                className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[24px] font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] bg-rose-500 text-white py-5 rounded-[24px] font-black shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {editingId ? <><Save size={20} /> Update Registry</> : <><CheckCircle2 size={20} /> Save Entry</>}
              </button>
           </div>
        </form>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-[24px] shadow-sm border border-gray-100">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search in history..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent rounded-xl outline-none text-sm font-medium focus:ring-0"
            />
         </div>
         <div className="h-8 w-[1px] bg-gray-100 hidden md:block"></div>
         <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="px-6 py-3 bg-transparent rounded-xl outline-none text-sm font-bold text-gray-500 border-none focus:ring-0 cursor-pointer"
         >
            <option value="all">Everything</option>
            <option value={RecordType.NOTE}>Notes</option>
            <option value={RecordType.APPOINTMENT}>Appointments</option>
            <option value={RecordType.VACCINATION}>Vaccinations</option>
            <option value={RecordType.VOMIT}>Vomiting</option>
            <option value={RecordType.WEIGHT}>Weight</option>
            <option value={RecordType.SYMPTOM}>Symptoms</option>
         </select>
      </div>

      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-rose-200 before:to-transparent">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-rose-200" size={32} /></div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                 <AlertCircle size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records found</p>
            </div>
          ) : filteredRecords.map(record => {
            const style = getTypeStyle(record.type);
            const dateObj = new Date(record.date);
            const isToday = record.date === new Date().toISOString().split('T')[0];
            const isMedical = record.type === RecordType.APPOINTMENT || record.type === RecordType.VACCINATION;
            
            return (
              <div key={record.id} className="relative group animate-fade-in">
                 <div className={`absolute -left-[45px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-md transition-all group-hover:scale-125 z-10 ${isToday ? 'bg-rose-500 scale-110 ring-4 ring-rose-100' : 'bg-gray-200'}`}></div>
                 
                 <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-rose-100 relative group/card overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                       <div className="flex gap-5 flex-1 min-w-0">
                          <div className={`w-14 h-14 shrink-0 rounded-[22px] flex items-center justify-center shadow-sm ${style.bg} ${style.text}`}>
                             {style.icon}
                          </div>
                          
                          <div className="space-y-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${style.border} ${style.text}`}>
                                   {record.type}
                                </span>
                                {isMedical && record.status && getStatusBadge(record.status)}
                                <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                                   <Clock size={10} /> {record.time}
                                </span>
                             </div>
                             <h4 className="font-black text-gray-800 text-xl leading-none pt-1 truncate">{record.title}</h4>
                             <p className="text-sm font-bold text-gray-400 flex items-center gap-1">
                                {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {record.location && <><span className="mx-1">•</span> <MapPin size={12} className="text-rose-300" /> {record.location}</>}
                             </p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(record)}
                            className="p-3 bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all active:scale-90"
                            title="Edit"
                          >
                             <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"
                            title="Delete"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                    
                    {record.details && (
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                           {record.details}
                        </p>
                      </div>
                    )}

                    {isMedical && (
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-4">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mark Status:</span>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(record, EventStatus.COMPLETED)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${record.status === EventStatus.COMPLETED ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                               <CheckCircle2 size={14} /> Completed
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(record, EventStatus.MISSED)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${record.status === EventStatus.MISSED ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                            >
                               <XCircle size={14} /> Missed
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(record, EventStatus.PENDING)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${record.status === EventStatus.PENDING ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                               <Clock size={14} /> Pending
                            </button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
      </div>

      {!isAdding && (
        <button 
          onClick={() => { setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 text-white rounded-full shadow-2xl shadow-rose-200 flex items-center justify-center active:scale-90 transition-transform md:hidden z-50"
        >
           <Plus size={24} />
        </button>
      )}
    </div>
  );
};
