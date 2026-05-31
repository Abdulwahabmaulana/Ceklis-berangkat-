import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Trip, ChecklistItem, Schedule, ScheduleLinkedItem, FrequentGroup } from '../types';

const DEFAULT_TEMPLATES: FrequentGroup[] = [
  { id: 't1', name: 'Dokumen Penting', items: ['KTP / ID Card', 'Paspor', 'Tiket Transportasi', 'Uang Tunai', 'Kartu Kredit / Debit'] },
  { id: 't2', name: 'Elektronik', items: ['Handphone', 'Charger HP', 'Powerbank', 'Earphone / Headphone', 'Laptop'] },
  { id: 't3', name: 'Pakaian Dasar', items: ['Baju Ganti', 'Celana / Rok', 'Pakaian Dalam', 'Kaos Kaki', 'Jaket / Sweater'] },
  { id: 't4', name: 'Perlengkapan Mandi & Obat', items: ['Sabun Mandi', 'Sampo', 'Sikat Gigi & Pasta Gigi', 'Handuk Kecil', 'Obat Pribadi', 'P3K Mini'] }
];

interface AppState {
  trips: Trip[];
  checklistItems: ChecklistItem[];
  schedules: Schedule[];
  scheduleLinkedItems: ScheduleLinkedItem[];
  templates: FrequentGroup[];
}

interface AppContextPayload extends AppState {
  setTrips: (t: Trip[] | ((prev: Trip[]) => Trip[])) => void;
  setChecklistItems: (t: ChecklistItem[] | ((prev: ChecklistItem[]) => ChecklistItem[])) => void;
  setSchedules: (t: Schedule[] | ((prev: Schedule[]) => Schedule[])) => void;
  setScheduleLinkedItems: (t: ScheduleLinkedItem[] | ((prev: ScheduleLinkedItem[]) => ScheduleLinkedItem[])) => void;
  setTemplates: (t: FrequentGroup[] | ((prev: FrequentGroup[]) => FrequentGroup[])) => void;
}

const AppContext = createContext<AppContextPayload | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'siap-berangkat-state';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleLinkedItems, setScheduleLinkedItems] = useState<ScheduleLinkedItem[]>([]);
  const [templates, setTemplates] = useState<FrequentGroup[]>(DEFAULT_TEMPLATES);

  // Load Initial Data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppState>;
        if (parsed.trips) setTrips(parsed.trips);
        if (parsed.checklistItems) setChecklistItems(parsed.checklistItems);
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.scheduleLinkedItems) setScheduleLinkedItems(parsed.scheduleLinkedItems);
        if (parsed.templates && parsed.templates.length > 0) setTemplates(parsed.templates);
      }
    } catch (e) {
      console.error('Failed to parse local storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave: AppState = {
      trips,
      checklistItems,
      schedules,
      scheduleLinkedItems,
      templates
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [trips, checklistItems, schedules, scheduleLinkedItems, templates, isLoaded]);

  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-emerald-600 font-medium">Memuat Data...</div>;

  return (
    <AppContext.Provider value={{
      trips, setTrips,
      checklistItems, setChecklistItems,
      schedules, setSchedules,
      scheduleLinkedItems, setScheduleLinkedItems,
      templates, setTemplates
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
