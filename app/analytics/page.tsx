'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import AuthWrapper from '@/components/Layout/AuthWrapper';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ChartBarIcon as Activity, 
  UsersIcon as Users, 
  MagnifyingGlassIcon as Search, 
  ArrowDownTrayIcon as Download, 
  EyeIcon as Eye, 
  ClockIcon as Clock,
  ArrowTrendingUpIcon as TrendingUp,
  CalendarIcon as Calendar
} from '@heroicons/react/24/outline';

interface UserAnalytics {
  user: any;
  summary: {
    totalSessions: number;
    totalActivities: number;
    totalSearches: number;
    totalDownloads: number;
    totalViews: number;
    avgSessionDuration: number;
    totalTimeSpent: number;
  };
  recentActivities: any[];
  recentSessions: any[];
}

interface UsageInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const { trackPageView, checkUsage } = useAnalytics();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [searchUsage, setSearchUsage] = useState<UsageInfo | null>(null);
  const [downloadUsage, setDownloadUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (status === 'authenticated') {
      trackPageView('/analytics');
      fetchAnalytics();
      fetchUsageInfo();
    }
  }, [status, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/activity?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageInfo = async () => {
    try {
      const [searchInfo, downloadInfo] = await Promise.all([
        checkUsage('search'),
        checkUsage('download')
      ]);
      setSearchUsage(searchInfo);
      setDownloadUsage(downloadInfo);
    } catch (error) {
      console.error('Error fetching usage info:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // if (status === 'loading' || loading) {
  //   return (
  //       <div></div>
  //     // <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //     //   <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     // </div>
  //   );
  // }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view analytics.</p>
        </div>
      </div>
    );
  }

  const activityData = analytics?.recentActivities.reduce((acc: any[], activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []) || [];

  const activityTypeData = analytics?.recentActivities.reduce((acc: any, activity) => {
    const type = activity.activityType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(activityTypeData || {}).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  return (
    <AuthWrapper>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2 font-medium text-white">Track your platform usage and activity insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black font-medium bg-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Usage Limits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Search Quota</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {searchUsage?.remaining || 0} / {searchUsage?.limit || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Searches remaining this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((searchUsage?.limit || 0) - (searchUsage?.remaining || 0)) / (searchUsage?.limit || 1) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Download Quota</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {downloadUsage?.remaining || 0} / {downloadUsage?.limit || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Downloads remaining this month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Download className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((downloadUsage?.limit || 0) - (downloadUsage?.remaining || 0)) / (downloadUsage?.limit || 1) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.summary.totalActivities || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.summary.totalSearches || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.summary.totalDownloads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics?.summary.avgSessionDuration || 0)}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Types */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#FF7722"
                  dataKey="value"
                  className='text-orange-600'
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#EA580C" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics?.recentActivities.slice(0, 10).map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.activityType === 'SEARCH_RESUME' ? 'bg-blue-100 text-blue-800' :
                        activity.activityType === 'DOWNLOAD_RESUME' ? 'bg-green-100 text-green-800' :
                        activity.activityType === 'VIEW_RESUME' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.activityType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.searchQuery && `Query: ${activity.searchQuery}`}
                      {activity.resultsCount && ` (${activity.resultsCount} results)`}
                      {activity.timeSpent && ` - ${activity.timeSpent}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}