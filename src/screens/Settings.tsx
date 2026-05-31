import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { isTripArchived, formatDate } from '../lib/utils';
import { ArrowLeft, Archive, DownloadCloud, CheckCircle2, User } from 'lucide-react';
import { AppScreen } from '../types';

export function Settings({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { trips, schedules } = useAppStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const archivedTrips = trips.filter(t => isTripArchived(t, schedules));
  archivedTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleInstallApp = async () => {
    const prompt = (window as any).pwaInstallPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).pwaInstallPrompt = null;
      }
    } else {
      alert("Aplikasi sudah terinstall atau browser Anda tidak mendukung fitur ini.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 pt-10 pb-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Pengaturan</h1>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Status System */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Sistem & Koneksi</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-50">
              <span className="text-slate-700 font-medium">Status Aplikasi</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isOffline ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isOffline ? 'Offline Mode' : 'Online'}
              </span>
            </div>
            <button 
              onClick={handleInstallApp}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Install Aplikasi (PWA)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tambahkan ke layar utama HP untuk akses mudah</p>
              </div>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 px-2 text-center">
            Aplikasi ini dirancang sebagai PWA Mobile-First. Semua data disimpan secara lokal dan aman di perangkat Anda.
          </p>
        </section>

        {/* Archives */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-500" />
            Riwayat Arsip (Lewat &gt; 5 Hari)
          </h2>
          
          <div className="space-y-3">
            {archivedTrips.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-400 text-sm">
                Tidak ada riwayat perjalanan yang diarsipkan otomatis.
              </div>
            ) : (
              archivedTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-700">{trip.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(trip.date)}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Developer Identity */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Identitas Pengembang
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-slate-500">Pembuat Aplikasi</span>
              <span className="font-semibold text-slate-800">Abdul Wahab</span>
            </div>
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-slate-500">Nomor Telepon</span>
              <a href="tel:085695338505" className="font-semibold text-emerald-600 hover:underline">085695338505</a>
            </div>
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-slate-500">GitHub</span>
              <a href="https://github.com/abdulwahabcikarang" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 hover:underline">
                abdulwahabcikarang
              </a>
            </div>
            <div className="p-4">
              <span className="text-slate-500 block mb-2">Tech Stack</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">React</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">TypeScript</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">Tailwind CSS</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">Vite</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">PWA</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
