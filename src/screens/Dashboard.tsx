import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { generateId, isTripArchived, formatDate } from '../lib/utils';
import { BottomSheet } from '../components/BottomSheet';
import { Plus, MoreVertical, Settings, FolderTree, Calendar, Copy, Trash2, Edit2 } from 'lucide-react';
import { AppScreen, Trip } from '../types';

interface DashboardProps {
  onNavigate: (screen: AppScreen, tripId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { trips, schedules, checklistItems, setTrips, setChecklistItems, setSchedules } = useAppStore();
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [activeTripOptions, setActiveTripOptions] = useState<Trip | null>(null);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const activeTrips = trips.filter(t => !isTripArchived(t, schedules));
  
  // Sort by date (nearest first)
  activeTrips.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTrip: Trip = {
      id: generateId(),
      title: newTitle.trim(),
      date: newDate || new Date().toISOString().split('T')[0], // default today
    };
    setTrips(prev => [...prev, newTrip]);
    setIsNewTripOpen(false);
    setNewTitle('');
    setNewDate('');
    onNavigate('trip-detail', newTrip.id);
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setChecklistItems(prev => prev.filter(c => c.tripId !== tripId));
    setSchedules(prev => prev.filter(s => s.tripId !== tripId));
    setActiveTripOptions(null);
  };

  const handleDuplicateTrip = (trip: Trip) => {
    const newTripId = generateId();
    const newTrip: Trip = {
      ...trip,
      id: newTripId,
      title: `${trip.title} (Copy)`,
    };
    
    // Copy checklist but uncheck all
    const itemsToCopy = checklistItems.filter(c => c.tripId === trip.id);
    const newItems = itemsToCopy.map(c => ({
      ...c,
      id: generateId(),
      tripId: newTripId,
      completed: false
    }));

    setTrips(prev => [...prev, newTrip]);
    setChecklistItems(prev => [...prev, ...newItems]);
    // Note: Not copying schedules for duplicate by default as dates will be wrong.
    setActiveTripOptions(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-5 pt-10 pb-5 shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Siap Berangkat</h1>
          <p className="text-emerald-100 text-sm mt-0.5">Kelola Bawaan & Jadwal</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('templates')} className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-colors active:scale-95">
            <FolderTree className="w-5 h-5" />
          </button>
          <button onClick={() => onNavigate('settings')} className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-colors active:scale-95">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar">
        {activeTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 text-slate-500 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg text-slate-700">Belum Ada Perjalanan</h3>
            <p className="text-sm max-w-[250px]">Buat perjalanan baru untuk mulai menyusun daftar bawaan dan jadwal.</p>
          </div>
        ) : (
          activeTrips.map(trip => {
            const items = checklistItems.filter(c => c.tripId === trip.id);
            const completed = items.filter(c => c.completed).length;
            const progress = items.length === 0 ? 0 : Math.round((completed / items.length) * 100);

            return (
              <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform relative">
                <div className="pr-8" onClick={() => onNavigate('trip-detail', trip.id)}>
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{trip.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{formatDate(trip.date)}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Persiapan Bawaan</span>
                      <span className={progress === 100 ? 'text-emerald-600' : 'text-slate-600'}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Context Menu Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveTripOptions(trip); }}
                  className="absolute top-4 right-2 p-2 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* FAB Buat Perjalanan */}
      <button 
        onClick={() => setIsNewTripOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Trip Sheet */}
      <BottomSheet isOpen={isNewTripOpen} onClose={() => setIsNewTripOpen(false)} title="Buat Perjalanan">
        <form onSubmit={handleCreateTrip} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Perjalanan (Tujuan)</label>
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Contoh: Liburan ke Bali"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Berangkat</label>
            <input 
              type="date" 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-medium rounded-xl py-3.5 mt-2 hover:bg-emerald-700 active:scale-95 transition-all">
            Simpan & Mulai Persiapan
          </button>
        </form>
      </BottomSheet>

      {/* Trip Context Options */}
      <BottomSheet isOpen={!!activeTripOptions} onClose={() => setActiveTripOptions(null)} title="Opsi Perjalanan">
        {activeTripOptions && (
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => {
                 onNavigate('trip-detail', activeTripOptions.id);
                 setActiveTripOptions(null);
              }} 
              className="flex items-center gap-3 w-full p-4 hover:bg-slate-50 rounded-xl transition-colors text-left font-medium text-slate-700"
            >
              <Edit2 className="w-5 h-5 text-emerald-600" />
              Buka / Edit
            </button>
            <button 
              onClick={() => handleDuplicateTrip(activeTripOptions)} 
              className="flex items-center gap-3 w-full p-4 hover:bg-slate-50 rounded-xl transition-colors text-left font-medium text-slate-700"
            >
              <Copy className="w-5 h-5 text-blue-600" />
              Duplikat & Kosongkan Checklist
            </button>
            <button 
              onClick={() => handleDeleteTrip(activeTripOptions.id)} 
              className="flex items-center gap-3 w-full p-4 hover:bg-red-50 rounded-xl transition-colors text-left font-medium text-red-600"
            >
              <Trash2 className="w-5 h-5" />
              Hapus Perjalanan
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
