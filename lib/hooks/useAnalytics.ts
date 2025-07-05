'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ActivityType } from '@prisma/client';

interface UseAnalyticsReturn {
  sessionId: string | null;
  trackActivity: (activity: ActivityData) => Promise<void>;
  checkUsage: (type: 'search' | 'download') => Promise<UsageInfo>;
  incrementUsage: (type: 'search' | 'download') => Promise<{ success: boolean; usage: UsageInfo }>;
  trackPageView: (pageUrl: string) => Promise<void>;
  trackSearch: (searchData: SearchData) => Promise<void>;
  trackDownload: (downloadData: DownloadData) => Promise<void>;
  trackTimeSpent: (timeSpent: number, activity?: string) => Promise<void>;
}

interface ActivityData {
  activityType: ActivityType;
  description: string;
  metadata?: any;
  searchQuery?: string;
  jobCategory?: string;
  skillsSearched?: string;
  experienceLevel?: string;
  resultsCount?: number;
  timeSpent?: number;
  resumeId?: string;
  resumeFileName?: string;
  downloadPath?: string;
  viewDuration?: number;
  pageUrl?: string;
  featureUsed?: string;
}

interface SearchData {
  query: string;
  jobCategory?: string;
  skillsSearched?: string;
  experienceLevel?: string;
  resultsCount: number;
  timeSpent?: number;
}

interface DownloadData {
  resumeId: string;
  resumeFileName: string;
  downloadPath?: string;
}

interface UsageInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { data: session, status } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Initialize session when user logs in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !sessionId) {
      initializeSession();
    }
  }, [status, session, sessionId]);

  // Track page changes and time spent (simplified to prevent loops)
  useEffect(() => {
    if (!sessionId) return;
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        navigator.sendBeacon('/api/analytics/activity', JSON.stringify({
          activityType: 'PAGE_VIEW',
          description: `Time spent: ${timeSpent}s`,
          timeSpent,
          pageUrl: window.location.pathname,
          sessionId,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]); // Remove pageStartTime dependency

  // End session when user logs out
  useEffect(() => {
    if (status === 'unauthenticated' && sessionId) {
      endSession();
    }
  }, [status, sessionId]);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        
        // Track login activity
        await trackActivity({
          activityType: 'LOGIN',
          description: 'User logged in',
          pageUrl: window.location.pathname,
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      // Track logout activity
      await trackActivity({
        activityType: 'LOGOUT',
        description: 'User logged out',
        pageUrl: window.location.pathname,
      });

      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'end', sessionId }),
      });

      setSessionId(null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const trackActivity = useCallback(async (activityData: ActivityData) => {
    if (!sessionId || status !== 'authenticated' || isTracking) return;

    // Prevent duplicate calls for the same activity within a short time
    const activityKey = `${activityData.activityType}-${activityData.pageUrl}`;
    const now = Date.now();
    const lastCall = localStorage.getItem(`lastActivity-${activityKey}`);
    
    if (lastCall && (now - parseInt(lastCall)) < 2000) {
      return; // Skip if same activity was called within 2 seconds
    }
    
    localStorage.setItem(`lastActivity-${activityKey}`, now.toString());
    setIsTracking(true);
    
    try {
      await fetch('/api/analytics/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activityData,
          sessionId,
        }),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    } finally {
      setTimeout(() => setIsTracking(false), 500);
    }
  }, [sessionId, status, isTracking]);

  const checkUsage = useCallback(async (type: 'search' | 'download'): Promise<UsageInfo> => {
    try {
      const response = await fetch(`/api/analytics/usage?type=${type}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to check usage');
    } catch (error) {
      console.error('Error checking usage:', error);
      return { allowed: false, remaining: 0, limit: 0 };
    }
  }, []);

  const incrementUsage = useCallback(async (type: 'search' | 'download') => {
    try {
      const response = await fetch('/api/analytics/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to increment usage');
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return { success: false, usage: { allowed: false, remaining: 0, limit: 0 } };
    }
  }, []);

  const trackPageView = useCallback(async (pageUrl: string) => {
    await trackActivity({
      activityType: 'PAGE_VIEW',
      description: `Viewed page: ${pageUrl}`,
      pageUrl,
    });
    setPageStartTime(Date.now());
  }, [trackActivity]);

  const trackSearch = useCallback(async (searchData: SearchData) => {
    await trackActivity({
      activityType: 'SEARCH_RESUME',
      description: `Searched for: ${searchData.query}`,
      searchQuery: searchData.query,
      jobCategory: searchData.jobCategory,
      skillsSearched: searchData.skillsSearched,
      experienceLevel: searchData.experienceLevel,
      resultsCount: searchData.resultsCount,
      timeSpent: searchData.timeSpent,
      pageUrl: window.location.pathname,
    });
  }, [trackActivity]);

  const trackDownload = useCallback(async (downloadData: DownloadData) => {
    await trackActivity({
      activityType: 'DOWNLOAD_RESUME',
      description: `Downloaded resume: ${downloadData.resumeFileName}`,
      resumeId: downloadData.resumeId,
      resumeFileName: downloadData.resumeFileName,
      downloadPath: downloadData.downloadPath,
      pageUrl: window.location.pathname,
    });
  }, [trackActivity]);

  const trackTimeSpent = useCallback(async (timeSpent: number, activity?: string) => {
    if (timeSpent < 5) return; // Don't track very short sessions

    await trackActivity({
      activityType: 'PAGE_VIEW',
      description: `Time spent on ${activity || 'page'}: ${timeSpent}s`,
      timeSpent,
      pageUrl: activity || window.location.pathname,
    });
  }, [trackActivity]);

  return {
    sessionId,
    trackActivity,
    checkUsage,
    incrementUsage,
    trackPageView,
    trackSearch,
    trackDownload,
    trackTimeSpent,
  };
}