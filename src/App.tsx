/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider } from './store/AppContext';
import { Dashboard } from './screens/Dashboard';
import { TemplateManager } from './screens/TemplateManager';
import { Settings } from './screens/Settings';
import { TripDetail } from './screens/TripDetail';
import type { AppScreen } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [activeTripId, setActiveTripId] = useState<string | undefined>();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Global Routing & PWA Install Listener
  useEffect(() => {
    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).pwaInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // History routing initialization for Hardware Back Button support
    const initState = window.history.state;
    if (!initState || !initState.screen) {
      window.history.replaceState({ screen: 'exit-trap' }, '');
      window.history.pushState({ screen: 'dashboard' }, '');
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen(initState.screen);
      setActiveTripId(initState.tripId);
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state?.screen === 'exit-trap') {
        setShowExitConfirm(true);
        // Push dashboard again to prevent app from closing under dialog
        window.history.pushState({ screen: 'dashboard' }, '');
      } else if (state?.screen) {
        setCurrentScreen(state.screen);
        setActiveTripId(state.tripId);
        setShowExitConfirm(false);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (screen: AppScreen, tripId?: string) => {
    if (currentScreen === screen && activeTripId === tripId) return;

    if (screen === 'dashboard' && currentScreen !== 'dashboard') {
      // If we navigate back to dashboard from any sub-screen, use history back
      // so it pops the current state and restores native history order.
      window.history.back();
    } else {
      // Navigating deeper (Dashboard -> Detail, etc.)
      window.history.pushState({ screen, tripId }, '');
      setCurrentScreen(screen);
      setActiveTripId(tripId);
    }
  };

  return (
    <AppProvider>
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl relative overflow-hidden font-sans border-x border-slate-200">
        {currentScreen === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {currentScreen === 'templates' && <TemplateManager onNavigate={navigate} />}
        {currentScreen === 'settings' && <Settings onNavigate={navigate} />}
        {currentScreen === 'trip-detail' && activeTripId && <TripDetail tripId={activeTripId} onNavigate={navigate} />}
      
        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Keluar Aplikasi?</h3>
              <p className="text-slate-500 mb-6 font-medium text-sm leading-relaxed">Apakah Anda yakin ingin keluar dari Checklist Berangkat?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setShowExitConfirm(false);
                    // Native exit logic (-2 exits the injected trap)
                    window.history.go(-2);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 active:scale-95 transition-all shadow-sm shadow-red-500/30 text-sm"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}
