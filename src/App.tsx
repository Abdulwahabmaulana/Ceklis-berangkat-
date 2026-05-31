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

  // Global PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Stash the event so it can be triggered later.
      (window as any).pwaInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const navigate = (screen: AppScreen, tripId?: string) => {
    setCurrentScreen(screen);
    if (tripId) setActiveTripId(tripId);
  };

  return (
    <AppProvider>
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl relative overflow-hidden font-sans border-x border-slate-200">
        {currentScreen === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {currentScreen === 'templates' && <TemplateManager onNavigate={navigate} />}
        {currentScreen === 'settings' && <Settings onNavigate={navigate} />}
        {currentScreen === 'trip-detail' && activeTripId && <TripDetail tripId={activeTripId} onNavigate={navigate} />}
      </div>
    </AppProvider>
  );
}
