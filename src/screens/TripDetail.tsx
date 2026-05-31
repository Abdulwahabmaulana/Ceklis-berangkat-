import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { generateId, formatDate, isToday, cn } from '../lib/utils';
import { BottomSheet } from '../components/BottomSheet';
import { ArrowLeft, Clock, Calendar, CheckSquare, Plus, Share2, MoreVertical, Flame, Check, Trash2, LayoutList, Search } from 'lucide-react';
import { AppScreen, ChecklistItem, Schedule, FrequentGroup } from '../types';

interface TripDetailProps {
  tripId: string;
  onNavigate: (screen: AppScreen) => void;
}

export function TripDetail({ tripId, onNavigate }: TripDetailProps) {
  const { trips, checklistItems, schedules, scheduleLinkedItems, templates, setChecklistItems, setSchedules, setScheduleLinkedItems } = useAppStore();
  const trip = trips.find(t => t.id === tripId);
  const [activeTab, setActiveTab] = useState<'checklist' | 'schedule'>('checklist');

  // If trip is missing (e.g. deleted), go back safely
  useEffect(() => {
    if (!trip) {
      onNavigate('dashboard');
    }
  }, [trip, onNavigate]);

  if (!trip) {
    return null;
  }

  // ============== CHECKLIST TAB LOGIC ==============
  const items = checklistItems.filter(c => c.tripId === tripId);
  
  // Sort Logic: Unchecked Urgent -> Unchecked -> Checked
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return 0; // maintain insertion order
    });
  }, [items]);

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  const toggleComplete = (id: string) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };
  const toggleUrgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, urgent: !i.urgent } : i));
  };
  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecklistItems(prev => prev.filter(i => i.id !== id));
  };

  const [isAddChecklistOpen, setIsAddChecklistOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  
  const handleAddManualChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    
    const inputItems = newChecklistText.split(',').map(item => item.trim()).filter(item => item.length > 0);
    if (inputItems.length === 0) return;

    const newItems = inputItems.map(text => ({
      id: generateId(),
      tripId,
      text,
      completed: false,
      urgent: false
    }));

    setChecklistItems(prev => [...prev, ...newItems]);
    setNewChecklistText('');
  };

  const [activeTemplateSelection, setActiveTemplateSelection] = useState<FrequentGroup | null>(null);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<string[]>([]);
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!searchCategoryQuery.trim()) return templates;
    const query = searchCategoryQuery.toLowerCase();
    return templates.filter(tpl => 
      tpl.name.toLowerCase().includes(query) || 
      tpl.items.some(item => item.toLowerCase().includes(query))
    );
  }, [templates, searchCategoryQuery]);

  const handleOpenTemplateSelection = (tpl: FrequentGroup) => {
    setActiveTemplateSelection(tpl);
    setSelectedTemplateItems([...tpl.items]);
  };

  const toggleTemplateItem = (itemText: string) => {
    setSelectedTemplateItems(prev => prev.includes(itemText) ? prev.filter(i => i !== itemText) : [...prev, itemText]);
  };

  const handleConfirmTemplateSelection = () => {
    if (!activeTemplateSelection) return;
    const newItems = selectedTemplateItems.map(text => ({
      id: generateId(),
      tripId,
      text,
      completed: false,
      urgent: false
    }));
    setChecklistItems(prev => [...prev, ...newItems]);
    setActiveTemplateSelection(null);
    setIsAddChecklistOpen(false);
  };

  const handleShareChecklist = () => {
    const textBuilder = [`Daftar Bawaan: *${trip.title}* (${formatDate(trip.date)})`, ''];
    sortedItems.forEach(i => {
      textBuilder.push(`[${i.completed ? 'X' : ' '}] ${i.text}${i.urgent ? ' ❗' : ''}`);
    });
    
    if (navigator.share) {
      navigator.share({
        title: `Bawaan: ${trip.title}`,
        text: textBuilder.join('\n')
      }).catch(err => {
        if (err.name !== 'AbortError' && err.message !== 'Share canceled') {
          console.error('Error sharing:', err);
        }
      });
    } else {
      alert("Fitur share tidak didukung di browser ini. Tetapi Anda dapat mengcopynya secara manual:\n\n" + textBuilder.join('\n'));
    }
  };


  // ============== SCHEDULE TAB LOGIC ==============
  const tripSchedules = schedules.filter(s => s.tripId === tripId);
  const sortedSchedules = useMemo(() => {
    return [...tripSchedules].sort((a, b) => {
      const d1 = new Date(`${a.date}T${a.time}`);
      const d2 = new Date(`${b.date}T${b.time}`);
      return d1.getTime() - d2.getTime();
    });
  }, [tripSchedules]);

  // Group by date
  const groupedSchedules = useMemo(() => {
    const groups: Record<string, Schedule[]> = {};
    sortedSchedules.forEach(s => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
  }, [sortedSchedules]);

  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedDate, setNewSchedDate] = useState(trip.date);
  const [newSchedTime, setNewSchedTime] = useState('');
  
  const [activeSchedOption, setActiveSchedOption] = useState<Schedule | null>(null);

  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [isLinkItemsOpen, setIsLinkItemsOpen] = useState(false);
  const [scheduleToLink, setScheduleToLink] = useState<Schedule | null>(null);

  const toggleScheduleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const toggleLinkItem = (scheduleId: string, checklistItemId: string) => {
    setScheduleLinkedItems(prev => {
      const exists = prev.some(l => l.scheduleId === scheduleId && l.checklistItemId === checklistItemId);
      if (exists) {
        return prev.filter(l => !(l.scheduleId === scheduleId && l.checklistItemId === checklistItemId));
      }
      return [...prev, { scheduleId, checklistItemId }];
    });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedTitle.trim()) return;
    setSchedules(prev => [...prev, {
      id: generateId(),
      tripId,
      title: newSchedTitle.trim(),
      date: newSchedDate || new Date().toISOString().split('T')[0],
      time: newSchedTime || '08:00'
    }]);
    setNewSchedTitle('');
    setNewSchedTime('');
    setIsAddScheduleOpen(false);
  };

  const handleExportCalendar = (sched: Schedule) => {
    const startDt = new Date(`${sched.date}T${sched.time}`);
    const endDt = new Date(startDt.getTime() + 60 * 60 * 1000); // +1 hr default
    
    // Format to YYYYMMDDTHHmmssZ
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(sched.title)}&dates=${fmt(startDt)}/${fmt(endDt)}&details=${encodeURIComponent('Acara perjalanan: ' + trip.title)}`;
    
    window.open(url, '_blank');
    setActiveSchedOption(null);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    setActiveSchedOption(null);
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-24">
      {/* App Bar */}
      <div className="bg-emerald-600 text-white px-5 pt-10 pb-4 shadow-sm z-20 sticky top-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="p-1 -ml-1 rounded-full hover:bg-emerald-500 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="overflow-hidden pr-2">
              <h1 className="text-xl font-bold truncate">{trip.title}</h1>
              <p className="text-emerald-100 text-xs font-medium">{formatDate(trip.date)}</p>
            </div>
          </div>
          <button onClick={handleShareChecklist} className="p-2 bg-emerald-500 rounded-full hover:bg-emerald-400 transition-colors flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Definition */}
        <div className="flex bg-emerald-700/50 rounded-xl p-1 relative z-10 w-full overflow-hidden">
          {/* Active indicator */}
          <div 
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
            style={{ width: 'calc(50% - 4px)', left: activeTab === 'checklist' ? '4px' : 'calc(50%)' }}
          />
          <button 
            onClick={() => setActiveTab('checklist')}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 relative z-10 transition-colors", activeTab === 'checklist' ? "text-emerald-700" : "text-emerald-50")}
          >
            <CheckSquare className="w-4 h-4" /> Bawaan
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 relative z-10 transition-colors", activeTab === 'schedule' ? "text-emerald-700" : "text-emerald-50")}
          >
            <Calendar className="w-4 h-4" /> Jadwal
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        
        {/* CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Progress Panel */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{completedCount} <span className="text-sm font-medium text-slate-500">/ {items.length} selesai</span></h3>
                </div>
                <div className="text-emerald-600 font-bold">{progressPercent}%</div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                <LayoutList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Checklist kosong. Tekan + untuk menambah.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleComplete(item.id)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                      item.completed 
                        ? "bg-slate-50 border-slate-100 opacity-60" 
                        : item.urgent 
                          ? "bg-red-50/50 border-red-100 shadow-sm"
                          : "bg-white border-slate-100 shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors",
                      item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent"
                    )}>
                      <Check className="w-4 h-4" />
                    </div>
                    
                    <span className={cn(
                      "flex-1 font-medium transition-all text-[15px]",
                      item.completed ? "text-slate-400 line-through" : "text-slate-700"
                    )}>
                      {item.text}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => toggleUrgent(item.id, e)}
                        className={cn("p-2 rounded-full transition-colors", item.urgent ? "text-red-500 bg-red-100" : "text-slate-300 hover:text-red-500 hover:bg-slate-100")}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => deleteItem(item.id, e)}
                        className="p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div>
             {groupedSchedules.length === 0 ? (
               <div className="text-center text-slate-400 py-10">
                 <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                 <p>Belum ada jadwal. Tekan + untuk menyusun Itinerary.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {groupedSchedules.map(([date, scheds]) => {
                   const today = isToday(date);
                   return (
                     <div key={date} className="relative">
                       {/* Date Header */}
                       <div className="flex items-center gap-2 mb-4 sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10">
                         <div className={cn("px-3 py-1 text-sm font-bold rounded-full", today ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700")}>
                           {formatDate(date)} {today && '(Hari Ini)'}
                         </div>
                         <div className="flex-1 h-px bg-slate-200" />
                       </div>

                       {/* Timeline List */}
                       <div className="pl-3 border-l-2 border-slate-200 space-y-4 ml-3 relative pb-2">
                         {scheds.map(sched => {
                           // Basic real-time check (if same date, is current hour match? rough estimate)
                           const isNow = today && new Date().getHours() === parseInt(sched.time.split(':')[0]);

                           return (
                             <div key={sched.id} className="relative pl-6">
                               {/* Timeline Dot */}
                               <div className={cn("absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-slate-50", isNow ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-300")} />
                               
                               <div 
                                 className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-all"
                                 onContextMenu={(e) => { e.preventDefault(); setActiveSchedOption(sched); }}
                                 onClick={() => setExpandedScheduleId(prev => prev === sched.id ? null : sched.id)}
                               >
                                 <div className="flex justify-between items-start gap-2">
                                   <div className="flex items-start gap-3">
                                     <button 
                                       onClick={(e) => toggleScheduleComplete(sched.id, e)}
                                       className={cn("mt-1 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", sched.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-400")}
                                     >
                                       <Check className="w-4 h-4" />
                                     </button>
                                     <div>
                                       <span className={cn("inline-block mb-1 text-xs font-bold px-2 py-0.5 rounded-md", isNow ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                                         {sched.time}
                                       </span>
                                       <h4 className={cn("font-bold leading-snug transition-colors", sched.completed ? "text-slate-400 line-through" : "text-slate-800")}>{sched.title}</h4>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setActiveSchedOption(sched); }}
                                     className="p-1 text-slate-300 hover:text-slate-600 rounded-full bg-slate-50 relative z-10"
                                   >
                                     <MoreVertical className="w-4 h-4" />
                                   </button>
                                 </div>
                                 
                                 {/* Expansion Area (Linked Items) */}
                                 {expandedScheduleId === sched.id && (
                                   <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bawaan Terkait</h5>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setScheduleToLink(sched); setIsLinkItemsOpen(true); }}
                                          className="text-emerald-600 text-sm font-medium hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md transition-colors relative z-10"
                                        >
                                          + Pilih Bawaan
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-2 mt-3">
                                        {(() => {
                                           const linkedItemIds = scheduleLinkedItems.filter(l => l.scheduleId === sched.id).map(l => l.checklistItemId);
                                           const linkedChecklists = items.filter(i => linkedItemIds.includes(i.id));
                                           
                                           if (linkedChecklists.length === 0) {
                                             return <p className="text-sm text-slate-400 italic">Belum ada bawaan yang ditautkan.</p>
                                           }
                                           
                                           return linkedChecklists.map(item => (
                                              <div 
                                                key={item.id} 
                                                onClick={(e) => { e.stopPropagation(); toggleComplete(item.id); }}
                                                className={cn("flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer relative z-10", item.completed ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200")}
                                              >
                                                <div className={cn("w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors", item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent")}>
                                                  <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <span className={cn("text-sm font-medium flex-1", item.completed ? "text-slate-400 line-through" : "text-slate-700")}>{item.text}</span>
                                              </div>
                                           ));
                                        })()}
                                      </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   )
                 })}
               </div>
             )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => activeTab === 'checklist' ? setIsAddChecklistOpen(true) : setIsAddScheduleOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ============== BOTTOM SHEETS ============== */}
      
      {/* 1. Add Checklist Option */}
      <BottomSheet isOpen={isAddChecklistOpen} onClose={() => { setIsAddChecklistOpen(false); setActiveTemplateSelection(null); setSearchCategoryQuery(''); }} title={activeTemplateSelection ? `Pilih dari ${activeTemplateSelection.name}` : "Tambah Bawaan"}>
        {activeTemplateSelection ? (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                {activeTemplateSelection.items.map(item => (
                  <div key={item} onClick={() => toggleTemplateItem(item)} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", selectedTemplateItems.includes(item) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent")}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveTemplateSelection(null)} className="flex-1 py-3.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button onClick={handleConfirmTemplateSelection} className="flex-[2] bg-emerald-600 text-white font-medium rounded-xl py-3.5 hover:bg-emerald-700 active:scale-95 transition-all">
                  Tambahkan ({selectedTemplateItems.length})
                </button>
              </div>
            </div>
        ) : (
          <>
            <form onSubmit={handleAddManualChecklist} className="mb-6 flex gap-2">
              <input 
                type="text"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 text-sm"
                placeholder="Pisahkan banyak barang dengan koma..."
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
              />
              <button type="submit" className="bg-emerald-600 text-white font-medium rounded-xl px-5 hover:bg-emerald-700 active:scale-95 transition-all">
                Add
              </button>
            </form>
            
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Atau Pilih Dari Kategori</h4>
              
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari kategori atau barang..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-emerald-500 text-sm transition-all"
                  value={searchCategoryQuery}
                  onChange={(e) => setSearchCategoryQuery(e.target.value)}
                />
              </div>

              {filteredTemplates.map(tpl => (
                <button 
                  key={tpl.id}
                  onClick={() => handleOpenTemplateSelection(tpl)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-700">{tpl.name}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">{tpl.items.join(', ')}</div>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                 <div className="text-center text-sm text-slate-400 py-4">Tidak ada kategori yang cocok.</div>
              )}
            </div>
          </>
        )}
      </BottomSheet>

      {/* 2. Add Schedule */}
      <BottomSheet isOpen={isAddScheduleOpen} onClose={() => setIsAddScheduleOpen(false)} title="Tambah Jadwal">
        <form onSubmit={handleAddSchedule} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Aktivitas</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Check-in Bandara"
              value={newSchedTitle}
              onChange={e => setNewSchedTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal</label>
              <input 
                type="date" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                value={newSchedDate}
                onChange={e => setNewSchedDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jam</label>
              <input 
                type="time" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                value={newSchedTime}
                onChange={e => setNewSchedTime(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-medium rounded-xl py-3.5 mt-2 hover:bg-emerald-700 active:scale-95 transition-all">
            Simpan Jadwal
          </button>
        </form>
      </BottomSheet>

      {/* 3. Schedule Context Options */}
      <BottomSheet isOpen={!!activeSchedOption} onClose={() => setActiveSchedOption(null)} title="Opsi Jadwal">
        {activeSchedOption && (
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => handleExportCalendar(activeSchedOption)}
              className="flex items-center gap-3 w-full p-4 hover:bg-blue-50 rounded-xl transition-colors text-left font-medium text-blue-700"
            >
              <Calendar className="w-5 h-5" />
              Export ke Google Calendar
            </button>
            <button 
              onClick={() => handleDeleteSchedule(activeSchedOption.id)} 
              className="flex items-center gap-3 w-full p-4 hover:bg-red-50 rounded-xl transition-colors text-left font-medium text-red-600"
            >
              <Trash2 className="w-5 h-5" />
              Hapus Jadwal Ini
            </button>
          </div>
        )}
      </BottomSheet>

      {/* 4. Select Linked Items for Schedule */}
      <BottomSheet isOpen={isLinkItemsOpen} onClose={() => setIsLinkItemsOpen(false)} title="Pilih Bawaan ke Jadwal">
        {scheduleToLink && (
           <div className="mt-2 space-y-2">
              <p className="text-sm text-slate-500 mb-3">Tautkan checklist ke jadwal: <span className="font-semibold text-slate-700">{scheduleToLink.title}</span></p>
              {items.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-4">Daftar bawaan masih kosong. Tambahkan dulu di Tab Bawaan.</div>
              ) : (
                items.map(item => {
                  const isLinked = scheduleLinkedItems.some(l => l.scheduleId === scheduleToLink.id && l.checklistItemId === item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleLinkItem(scheduleToLink.id, item.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors", isLinked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent")}>
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-slate-700 font-medium">{item.text}</span>
                    </div>
                  )
                })
              )}
           </div>
        )}
      </BottomSheet>

    </div>
  );
}
