'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import AuthWrapper from '@/components/Layout/AuthWrapper';

export default function TestAnalyticsPage() {
  const { data: session, status } = useSession();
  const { 
    sessionId, 
    trackActivity, 
    checkUsage, 
    incrementUsage, 
    trackPageView, 
    trackSearch, 
    trackDownload 
  } = useAnalytics();
  
  const [searchUsage, setSearchUsage] = useState<any>(null);
  const [downloadUsage, setDownloadUsage] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      trackPageView('/test-analytics');
      loadUsageInfo();
    }
  }, [status]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadUsageInfo = async () => {
    try {
      const [search, download] = await Promise.all([
        checkUsage('search'),
        checkUsage('download')
      ]);
      setSearchUsage(search);
      setDownloadUsage(download);
      addTestResult('✅ Usage info loaded successfully');
    } catch (error) {
      addTestResult('❌ Failed to load usage info');
    }
  };

  const testSearch = async () => {
    try {
      await trackSearch({
        query: 'React Developer',
        jobCategory: 'Software Development',
        skillsSearched: 'React, JavaScript, Node.js',
        experienceLevel: 'Mid-level',
        resultsCount: 25,
        timeSpent: 45
      });
      addTestResult('✅ Search activity tracked');
      
      const result = await incrementUsage('search');
      if (result.success) {
        addTestResult('✅ Search usage incremented');
        setSearchUsage(result.usage);
      }
    } catch (error) {
      addTestResult('❌ Search test failed');
    }
  };

  const testDownload = async () => {
    try {
      await trackDownload({
        resumeId: 'resume_123',
        resumeFileName: 'john_doe_resume.pdf',
        downloadPath: '/downloads/john_doe_resume.pdf'
      });
      addTestResult('✅ Download activity tracked');
      
      const result = await incrementUsage('download');
      if (result.success) {
        addTestResult('✅ Download usage incremented');
        setDownloadUsage(result.usage);
      }
    } catch (error) {
      addTestResult('❌ Download test failed');
    }
  };

  const testCustomActivity = async () => {
    try {
      await trackActivity({
        activityType: 'FEATURE_USAGE',
        description: 'User tested analytics system',
        featureUsed: 'Analytics Test Page',
        pageUrl: '/test-analytics',
        timeSpent: 120
      });
      addTestResult('✅ Custom activity tracked');
    } catch (error) {
      addTestResult('❌ Custom activity test failed');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to test analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">🧪 Analytics System Test</h1>
          <p className="text-gray-600 mb-6 font-medium">Test the analytics tracking system functionality and monitor real-time data</p>
          
          {/* Session Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Session Information</h3>
            <p><strong>User:</strong> {session?.user?.name} ({session?.user?.email})</p>
            <p><strong>Session ID:</strong> {sessionId || 'Not initialized'}</p>
            <p><strong>User ID:</strong> {session?.user?.id}</p>
          </div>

          {/* Usage Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Search Usage</h3>
              {searchUsage ? (
                <>
                  <p><strong>Remaining:</strong> {searchUsage.remaining}</p>
                  <p><strong>Limit:</strong> {searchUsage.limit}</p>
                  <p><strong>Allowed:</strong> {searchUsage.allowed ? '✅' : '❌'}</p>
                </>
              ) : (
                <p>Loading...</p>
              )}
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Download Usage</h3>
              {downloadUsage ? (
                <>
                  <p><strong>Remaining:</strong> {downloadUsage.remaining}</p>
                  <p><strong>Limit:</strong> {downloadUsage.limit}</p>
                  <p><strong>Allowed:</strong> {downloadUsage.allowed ? '✅' : '❌'}</p>
                </>
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Search Tracking
            </button>
            
            <button
              onClick={testDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Download Tracking
            </button>
            
            <button
              onClick={testCustomActivity}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Custom Activity
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No tests run yet. Click the buttons above to test functionality.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 flex space-x-4">
            <a
              href="/analytics"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Analytics Dashboard
            </a>
            <a
              href="/search"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Search Page
            </a>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}