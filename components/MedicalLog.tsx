import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Activity, CalendarCheck, Syringe, Ruler, NotebookPen, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { MedicalRecord, RecordType } from '../types';

export const MedicalLog: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [type, setType] = useState<RecordType>(RecordType.NOTE);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const data = await StorageService.getRecords();
    setRecords(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.addRecord({
      type,
      title,
      details,
      value,
      date
    });
    // Refresh list
    await fetchRecords();
    setIsAdding(false);
    resetForm();
  };

  const deleteRecord = async (id: string) => {
    if(window.confirm('Permanently delete this medical record?')) {
        await StorageService.deleteRecord(id);
        setRecords(records.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDetails('');
    setValue('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(RecordType.NOTE);
  };

  const getTypeIcon = (recordType: RecordType) => {
      switch (recordType) {
          case RecordType.APPOINTMENT: return <CalendarCheck size={18} />;
          case RecordType.VITALS: return <Activity size={18} />;
          case RecordType.VACCINATION: return <Syringe size={18} />;
          case RecordType.GROWTH: return <Ruler size={18} />;
          case RecordType.SYMPTOM: return <Activity size={18} />;
          default: return <NotebookPen size={18} />;
      }
  };

  const getTypeStyles = (recordType: RecordType) => {
      switch (recordType) {
          case RecordType.APPOINTMENT: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', accent: 'bg-blue-500' };
          case RecordType.VITALS: return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', accent: 'bg-rose-500' };
          case RecordType.VACCINATION: return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', accent: 'bg-purple-500' };
          case RecordType.GROWTH: return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', accent: 'bg-emerald-500' };
          case RecordType.SYMPTOM: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', accent: 'bg-amber-500' };
          default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', accent: 'bg-gray-500' };
      }
  };

  const getValuePlaceholder = (t: RecordType) => {
      switch(t) {
          case RecordType.GROWTH: return "e.g., Weight: 3.2kg";
          case RecordType.VITALS: return "e.g., BP: 120/80";
          case RecordType.VACCINATION: return "e.g., Dose 1";
          default: return "Optional value";
      }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 font-heading">Medical Registry</h2>
            <p className="text-sm text-gray-500 mt-1">Koala Baby Medical History</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 font-medium active:scale-95"
        >
          {isAdding ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Entry</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[24px] shadow-xl border border-gray-100 animate-slide-down">
          <h3 className="text-lg font-bold text-gray-800 mb-6 font-heading">New Medical Entry</h3>
          <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as RecordType)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                  >
                    <option value={RecordType.NOTE}>General Note</option>
                    <option value={RecordType.APPOINTMENT}>Doctor Appointment</option>
                    <option value={RecordType.VACCINATION}>Vaccination</option>
                    <option value={RecordType.GROWTH}>Growth Check</option>
                    <option value={RecordType.VITALS}>Vitals Check</option>
                    <option value={RecordType.SYMPTOM}>Symptom</option>
                  </select>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Title</label>
                 <input
                    type="text"
                    required
                    placeholder="Brief title for this record"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-medium text-lg"
                  />
              </div>

              <div className="mb-6 space-y-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Value / Measurement (Optional)</label>
                 <input
                    type="text"
                    placeholder={getValuePlaceholder(type)}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-mono text-sm"
                  />
              </div>

              <div className="mb-8 space-y-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                 <textarea
                    rows={3}
                    placeholder="Add details..."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                  ></textarea>
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                  Save to Database
              </button>
          </form>
        </div>
      )}

      {/* Timeline View */}
      <div className="relative pl-8 border-l-2 border-gray-100 space-y-8 py-2">
        {loading ? (
           <div className="text-gray-400 ml-4">Loading medical records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 ml-[-2px]">
            <p className="text-gray-400">No medical records found in database.</p>
          </div>
        ) : (
          records.map((record) => {
            const styles = getTypeStyles(record.type);
            return (
              <div key={record.id} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[41px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm ${styles.accent}`}></div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
                            {getTypeIcon(record.type)}
                         </div>
                         <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <h4 className="font-bold text-gray-800 text-lg font-heading">{record.title}</h4>
                         </div>
                      </div>
                      <button 
                         onClick={() => deleteRecord(record.id)}
                         className="text-gray-300 hover:text-red-400 transition-colors p-2"
                      >
                         <Trash2 size={16} />
                      </button>
                  </div>

                  <div className="pl-[52px]">
                      {record.value && (
                        <div className="inline-block bg-slate-50 text-slate-700 px-3 py-1 rounded-md text-sm font-mono font-semibold border border-slate-100 mb-3">
                           {record.value}
                        </div>
                      )}
                      
                      {record.details && (
                          <p className="text-gray-600 text-sm leading-relaxed">{record.details}</p>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};