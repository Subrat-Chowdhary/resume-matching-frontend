import { prisma } from './prisma';
import { ActivityType } from '@prisma/client';

// Types for analytics
export interface ActivityData {
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

export interface SessionData {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  device?: string;
  browser?: string;
}

// Utility to parse user agent
export function parseUserAgent(userAgent: string) {
  const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';
  let browser = 'Unknown';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return { device, browser };
}

// Get client IP address
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// Create or update user session
export async function createUserSession(
  userId: number,
  sessionData: SessionData
): Promise<string> {
  try {
    // End any existing active sessions for this user
    await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        logoutTime: new Date(),
        duration: undefined, // Will be calculated in a separate function
      },
    });

    // Create new session
    const session = await prisma.userSession.create({
      data: {
        userId,
        sessionId: `session_${userId}_${Date.now()}`,
        ...sessionData,
      },
    });

    return session.sessionId;
  } catch (error) {
    console.error('Error creating user session:', error);
    throw error;
  }
}

// Log user activity
export async function logUserActivity(
  userId: number,
  sessionId: string,
  activityData: ActivityData
): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        sessionId,
        ...activityData,
      },
    });

    // Update session last activity
    await prisma.userSession.update({
      where: { sessionId },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
}

// End user session
export async function endUserSession(sessionId: string): Promise<void> {
  try {
    const session = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (session) {
      const duration = Math.floor(
        (new Date().getTime() - session.loginTime.getTime()) / 1000
      );

      await prisma.userSession.update({
        where: { sessionId },
        data: {
          isActive: false,
          logoutTime: new Date(),
          duration,
        },
      });
    }
  } catch (error) {
    console.error('Error ending user session:', error);
    throw error;
  }
}

// Check and update usage limits
export async function checkUsageLimit(
  userId: number,
  type: 'search' | 'download'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Reset monthly counters if it's a new month
    const lastUpdate = user.updatedAt;
    if (lastUpdate.getMonth() !== currentMonth || lastUpdate.getFullYear() !== currentYear) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentMonthSearches: 0,
          currentMonthDownloads: 0,
        },
      });
      user.currentMonthSearches = 0;
      user.currentMonthDownloads = 0;
    }

    if (type === 'search') {
      const allowed = user.currentMonthSearches < user.monthlySearchLimit;
      return {
        allowed,
        remaining: user.monthlySearchLimit - user.currentMonthSearches,
        limit: user.monthlySearchLimit,
      };
    } else {
      const allowed = user.currentMonthDownloads < user.monthlyDownloadLimit;
      return {
        allowed,
        remaining: user.monthlyDownloadLimit - user.currentMonthDownloads,
        limit: user.monthlyDownloadLimit,
      };
    }
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
}

// Increment usage counter
export async function incrementUsage(
  userId: number,
  type: 'search' | 'download'
): Promise<void> {
  try {
    if (type === 'search') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentMonthSearches: {
            increment: 1,
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentMonthDownloads: {
            increment: 1,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

// Get user analytics summary
export async function getUserAnalytics(userId: number, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [activities, sessions, user] = await Promise.all([
      prisma.userActivity.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.userSession.findMany({
        where: {
          userId,
          loginTime: {
            gte: startDate,
          },
        },
        orderBy: {
          loginTime: 'desc',
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
      }),
    ]);

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalActivities = activities.length;
    const totalSearches = activities.filter(a => a.activityType === 'SEARCH_RESUME').length;
    const totalDownloads = activities.filter(a => a.activityType === 'DOWNLOAD_RESUME').length;
    const totalViews = activities.filter(a => a.activityType === 'VIEW_RESUME').length;
    
    const avgSessionDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / totalSessions || 0;
    const totalTimeSpent = activities.reduce((acc, a) => acc + (a.timeSpent || 0), 0);

    return {
      user,
      summary: {
        totalSessions,
        totalActivities,
        totalSearches,
        totalDownloads,
        totalViews,
        avgSessionDuration: Math.round(avgSessionDuration),
        totalTimeSpent,
      },
      recentActivities: activities.slice(0, 20),
      recentSessions: sessions.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
}

// Get system-wide analytics
export async function getSystemAnalytics(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [users, sessions, activities] = await Promise.all([
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.userSession.findMany({
        where: {
          loginTime: {
            gte: startDate,
          },
        },
      }),
      prisma.userActivity.findMany({
        where: {
          timestamp: {
            gte: startDate,
          },
        },
      }),
    ]);

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        sessions: {
          some: {
            loginTime: {
              gte: startDate,
            },
          },
        },
      },
    });

    return {
      totalUsers,
      activeUsers,
      newRegistrations: users.length,
      totalSessions: sessions.length,
      totalActivities: activities.length,
      totalSearches: activities.filter(a => a.activityType === 'SEARCH_RESUME').length,
      totalDownloads: activities.filter(a => a.activityType === 'DOWNLOAD_RESUME').length,
      totalUploads: activities.filter(a => a.activityType === 'UPLOAD_RESUME').length,
    };
  } catch (error) {
    console.error('Error getting system analytics:', error);
    throw error;
  }
}