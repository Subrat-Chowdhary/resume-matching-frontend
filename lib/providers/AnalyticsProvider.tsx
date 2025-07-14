'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

interface AnalyticsContextType {
  sessionId: string | null;
  trackActivity: any;
  checkUsage: any;
  incrementUsage: any;
  trackPageView: any;
  trackSearch: any;
  trackDownload: any;
  trackTimeSpent: any;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const analytics = useAnalytics();

  // Auto-track page visibility changes (disabled to prevent infinite loops)
  // useEffect(() => {
  //   if (status !== 'authenticated') return;

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible') {
  //       analytics.trackPageView(window.location.pathname);
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, [status, analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}