
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { MedicalRecord, RecordType } from '../types';
import { 
  Calendar, Droplets, Cookie, Pill, ClipboardList, ChevronDown, 
  Search, RefreshCcw, AlertCircle, X, Filter, Clock, Scale, 
  Syringe, NotebookPen, Sparkles, TrendingUp, Sparkle, Printer
} from 'lucide-react';

interface DailySummary {
  date: string;
  waterCount: number;
  nutsCount: number;
  medsTaken: number;
  allRecords: MedicalRecord[]; 
  filteredRecords: MedicalRecord[];
}

export const History: React.FC = () => {
  const [groupedHistory, setGroupedHistory] = useState<DailySummary[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadHistory();
    window.addEventListener('focus', loadHistory);
    return () => window.removeEventListener('focus', loadHistory);
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const allRecords = await StorageService.getRecords();
      const groups: Record<string, MedicalRecord[]> = {};
      
      allRecords.forEach(record => {
        const dateKey = record.date;
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(record);
      });

      const summaries: DailySummary[] = Object.keys(groups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map(date => {
          const dayRecords = groups[date];
          return {
            date,
            waterCount: dayRecords.filter(r => r.type === RecordType.WATER).length,
            nutsCount: dayRecords.filter(r => r.type === RecordType.NUTS).length,
            medsTaken: dayRecords.filter(r => r.type === RecordType.MEDICINE).length,
            allRecords: dayRecords,
            filteredRecords: [] // Populated by useMemo
          };
        });

      setGroupedHistory(summaries);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setFilterType('all');
  };

  const filteredHistory = useMemo(() => {
    return groupedHistory.map(summary => {
      const matchedRecords = summary.allRecords.filter(record => {
        const matchesType = filterType === 'all' || record.type === filterType;
        const matchesSearch = searchQuery === '' || 
          record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (record.details && record.details.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesSearch;
      });
      return { ...summary, filteredRecords: matchedRecords };
    }).filter(summary => {
      const matchesDate = (!startDate || summary.date >= startDate) && (!endDate || summary.date <= endDate);
      const isFilteringActive = filterType !== 'all' || searchQuery !== '';
      
      // Keep summary if it matches date range AND (we aren't filtering or it has matching records)
      return matchesDate && (!isFilteringActive || summary.filteredRecords.length > 0);
    });
  }, [groupedHistory, startDate, endDate, searchQuery, filterType]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  const getRecordIcon = (type: RecordType) => {
    switch (type) {
      case RecordType.WATER: return <Droplets size={16} />;
      case RecordType.NUTS: return <Cookie size={16} />;
      case RecordType.MEDICINE: return <Pill size={16} />;
      case RecordType.APPOINTMENT: return <Calendar size={16} />;
      case RecordType.VOMIT: return <AlertCircle size={16} />;
      case RecordType.WEIGHT: return <Scale size={16} />;
      case RecordType.VACCINATION: return <Syringe size={16} />;
      case RecordType.SYMPTOM: return <Sparkles size={16} />;
      default: return <NotebookPen size={16} />;
    }
  };

  const getTypeStyle = (rt: RecordType) => {
    switch (rt) {
      case RecordType.APPOINTMENT: return "bg-blue-50 text-blue-600 border-blue-100";
      case RecordType.VACCINATION: return "bg-purple-50 text-purple-600 border-purple-100";
      case RecordType.VOMIT: return "bg-red-50 text-red-600 border-red-100";
      case RecordType.SYMPTOM: return "bg-amber-50 text-amber-600 border-amber-100";
      case RecordType.WEIGHT: return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case RecordType.WATER: return "bg-sky-50 text-sky-600 border-sky-100";
      case RecordType.NUTS: return "bg-orange-50 text-orange-600 border-orange-100";
      case RecordType.MEDICINE: return "bg-indigo-50 text-indigo-600 border-indigo-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const handlePrintDailyReport = (summary: DailySummary) => {
    const meds = summary.allRecords.filter(r => r.type === RecordType.MEDICINE);
    const waters = summary.allRecords.filter(r => r.type === RecordType.WATER);
    const nuts = summary.allRecords.filter(r => r.type === RecordType.NUTS);

    const reportHtml = `
      <html>
        <head>
          <title>Medical History Report - ${summary.date}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1f2937; line-height: 1.6; max-width: 800px; mx: auto; }
            .header { border-bottom: 3px solid #fecdd3; padding-bottom: 25px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; color: #e11d48; font-size: 32px; font-weight: 800; }
            .header p { margin: 5px 0 0 0; font-weight: bold; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; font-size: 11px; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 800; color: #4b5563; border-left: 6px solid #fecdd3; padding: 8px 15px; margin-bottom: 20px; background: #fff1f2; text-transform: uppercase; letter-spacing: 1px; }
            .stat-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { background: #f9fafb; padding: 20px; border-radius: 16px; border: 1px solid #f3f4f6; text-align: center; }
            .stat-card label { display: block; font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px; }
            .stat-card span { font-size: 24px; font-weight: 800; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; background: #f9fafb; padding: 15px; border-bottom: 2px solid #e5e7eb; font-size: 12px; font-weight: 800; color: #6b7280; text-transform: uppercase; }
            td { padding: 15px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
            .time { font-weight: 800; color: #e11d48; white-space: nowrap; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #9ca3af; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1>Health Report</h1><p>Koala Baby Medical Tracking</p></div>
            <div style="text-align: right">
              <span style="font-weight: 900; color: #111827; font-size: 22px;">${formatDate(summary.date)}</span><br/>
              <span style="color: #6b7280; font-size: 14px; font-weight: 600;">Patient: Sumaiya</span>
            </div>
          </div>

          <div class="stat-grid">
             <div class="stat-card"><label>Hydration</label><span>${waters.length} / 8 Glasses</span></div>
             <div class="stat-card"><label>Superfoods</label><span>${nuts.length} Items</span></div>
             <div class="stat-card"><label>Medications</label><span>${meds.length} Taken</span></div>
          </div>

          <div class="section">
            <div class="section-title">Medication Log</div>
            ${meds.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Medicine</th>
                    <th>Dose Slot</th>
                  </tr>
                </thead>
                <tbody>
                  ${meds.map(m => `
                    <tr>
                      <td class="time">${m.time}</td>
                      <td><strong>${m.title.split(' (')[0]}</strong></td>
                      <td>${m.medicineSlot || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #9ca3af; font-style: italic;">No medications logged for this date.</p>'}
          </div>

          <div class="section">
            <div class="section-title">Hydration & Nutrition</div>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 40px;">
               <div>
                  <h4 style="font-size: 14px; margin-bottom: 15px; color: #0369a1;">Water Intake</h4>
                  ${waters.length > 0 ? `
                    <table>
                      <tbody>
                        ${waters.map(w => `<tr><td class="time">${w.time}</td><td>1 Glass</td></tr>`).join('')}
                      </tbody>
                    </table>
                  ` : '<p style="font-size: 13px; color: #9ca3af;">No water logs.</p>'}
               </div>
               <div>
                  <h4 style="font-size: 14px; margin-bottom: 15px; color: #c2410c;">Superfoods</h4>
                  ${nuts.length > 0 ? `
                    <table>
                      <tbody>
                        ${nuts.map(n => `<tr><td class="time">${n.time}</td><td>${n.title}</td></tr>`).join('')}
                      </tbody>
                    </table>
                  ` : '<p style="font-size: 13px; color: #9ca3af;">No superfood logs.</p>'}
               </div>
            </div>
          </div>

          <div class="footer">
            GENERATED BY KOALA BABY MEDICAL TRACKING SYSTEM • PRIVATE & CONFIDENTIAL
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      // Wait for resources to load if any
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 font-medium space-y-4">
        <RefreshCcw className="animate-spin text-rose-300" size={40} />
        <p className="animate-pulse tracking-widest uppercase text-xs font-bold">Unrolling your journey...</p>
      </div>
    );
  }

  const isAnyFilterActive = startDate || endDate || searchQuery || filterType !== 'all';

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-32 animate-fade-in">
      {/* Search and Filters Strip */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-rose-100 sticky top-24 z-30 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text"
              placeholder="Search details, symptoms, medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-rose-50 focus:bg-white transition-all text-sm font-medium"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-48">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all text-sm font-bold text-gray-600 appearance-none cursor-pointer"
                >
                  <option value="all">All Records</option>
                  <option value={RecordType.WATER}>Hydration</option>
                  <option value={RecordType.NUTS}>Superfoods</option>
                  <option value={RecordType.MEDICINE}>Medicine</option>
                  <option value={RecordType.APPOINTMENT}>Clinics</option>
                  <option value={RecordType.VOMIT}>Vomit</option>
                  <option value={RecordType.WEIGHT}>Weight</option>
                  <option value={RecordType.SYMPTOM}>Symptoms</option>
                </select>
                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
             </div>
             {isAnyFilterActive && (
               <button 
                 onClick={clearFilters}
                 className="p-3.5 bg-rose-50 text-rose-500 rounded-[20px] hover:bg-rose-100 transition-colors"
                 title="Clear Filters"
               >
                 <X size={20} />
               </button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-rose-50/50">
           <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Date Range:</span>
           <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-rose-50/50 border-none rounded-lg p-2 text-[10px] font-bold text-gray-600 outline-none" />
              <span className="text-gray-300">→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-rose-50/50 border-none rounded-lg p-2 text-[10px] font-bold text-gray-600 outline-none" />
           </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="relative">
        {/* The Vertical Connecting Line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-200 via-indigo-100 to-transparent -translate-x-1/2 hidden sm:block"></div>

        <div className="space-y-12">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-[40px] p-24 text-center border border-dashed border-gray-200 relative z-10">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <Search size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 font-heading">No moments found</h3>
              <p className="text-gray-400 mt-2 max-w-xs mx-auto text-sm">We couldn't find any records matching your current filters.</p>
              <button 
                onClick={clearFilters}
                className="mt-8 px-8 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all"
              >
                Reset Timeline
              </button>
            </div>
          ) : (
            filteredHistory.map((summary, index) => {
              const isEven = index % 2 === 0;
              const dateObj = new Date(summary.date);
              
              return (
                <div key={summary.date} className="relative group">
                  {/* Date Bubble on the Line */}
                  <div className="absolute left-8 md:left-1/2 top-0 -translate-x-1/2 z-20 hidden sm:block">
                     <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold border-4 border-white shadow-xl transition-all group-hover:scale-110 ${expandedDate === summary.date ? 'bg-rose-500 text-white' : 'bg-white text-rose-500'}`}>
                        <span className="text-[9px] uppercase leading-none">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-lg leading-none">{dateObj.getDate()}</span>
                     </div>
                  </div>

                  {/* The Day Content */}
                  <div className={`flex flex-col sm:flex-row items-center w-full ${isEven ? 'sm:justify-start' : 'sm:justify-end'}`}>
                    <div className={`w-full sm:w-[45%] ${isEven ? 'sm:pr-4' : 'sm:pl-4'} pl-16 sm:pl-0`}>
                      <div 
                        className={`bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-rose-100 cursor-pointer relative overflow-hidden ${expandedDate === summary.date ? 'ring-2 ring-rose-200 shadow-rose-100' : ''}`}
                        onClick={() => setExpandedDate(expandedDate === summary.date ? null : summary.date)}
                      >
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 leading-none mb-1">
                                {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                              </span>
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-gray-800 text-lg">{formatDate(summary.date)}</h3>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintDailyReport(summary);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                  title="Print Daily Report"
                                >
                                  <Printer size={14} />
                                </button>
                              </div>
                           </div>
                           <div className={`p-2 rounded-xl transition-all ${expandedDate === summary.date ? 'bg-rose-100 text-rose-600 rotate-180' : 'bg-gray-50 text-gray-300'}`}>
                             <ChevronDown size={18} />
                           </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {summary.waterCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-full border border-sky-100 text-[10px] font-black uppercase">
                              <Droplets size={12} /> {summary.waterCount}
                            </div>
                          )}
                          {summary.nutsCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[10px] font-black uppercase">
                              <Cookie size={12} /> {summary.nutsCount}
                            </div>
                          )}
                          {summary.medsTaken > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase">
                              <Pill size={12} /> {summary.medsTaken}
                            </div>
                          )}
                          {summary.allRecords.some(r => r.type === RecordType.APPOINTMENT) && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100 text-[10px] font-black uppercase">
                              <Calendar size={12} /> Visit
                            </div>
                          )}
                        </div>

                        {/* Peak Preview of details */}
                        <div className="space-y-2">
                           {summary.filteredRecords.slice(0, 2).map((r, i) => (
                             <div key={r.id} className="flex items-center gap-3 text-xs text-gray-500 font-medium bg-gray-50/50 p-2 rounded-xl">
                                <div className={`${getTypeStyle(r.type)} p-1.5 rounded-lg shrink-0 scale-75`}>
                                   {getRecordIcon(r.type)}
                                </div>
                                <span className="truncate">{r.title}</span>
                             </div>
                           ))}
                           {summary.filteredRecords.length > 2 && (
                             <div className="text-[10px] text-gray-400 font-bold italic pl-2">+ {summary.filteredRecords.length - 2} more entries</div>
                           )}
                        </div>
                      </div>

                      {/* Expanded Details - Rendered as nested "child" cards */}
                      {expandedDate === summary.date && (
                        <div className="mt-4 space-y-3 animate-fade-in pl-4 border-l-2 border-rose-100 ml-4">
                          {summary.filteredRecords.map((record) => (
                            <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col gap-2 transition-transform hover:scale-[1.01]">
                               <div className="flex justify-between items-start">
                                  <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${getTypeStyle(record.type)}`}>
                                     {getRecordIcon(record.type)}
                                     {record.type}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-300">
                                     <Clock size={10} /> {record.time}
                                  </div>
                               </div>
                               <h5 className="font-bold text-gray-800 text-sm leading-tight">{record.title}</h5>
                               {record.details && <p className="text-xs text-gray-500 leading-relaxed bg-gray-50/50 p-2 rounded-xl">{record.details}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Summary Tooltip or Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 z-50 animate-fade-in border border-white/10 scale-90 sm:scale-100">
         <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-rose-400" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total Memories</span>
               <span className="text-sm font-bold">{groupedHistory.reduce((acc, curr) => acc + curr.allRecords.length, 0)} Logged</span>
            </div>
         </div>
         <div className="h-6 w-px bg-white/10"></div>
         <div className="flex items-center gap-3">
            <Sparkle size={20} className="text-sky-400" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Unique Days</span>
               <span className="text-sm font-bold">{groupedHistory.length} Days</span>
            </div>
         </div>
      </div>
    </div>
  );
};
