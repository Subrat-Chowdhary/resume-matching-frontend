import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logUserActivity, getClientIP, parseUserAgent } from '@/lib/analytics';
import { ActivityType } from '@prisma/client';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      activityType,
      description,
      metadata,
      searchQuery,
      jobCategory,
      skillsSearched,
      experienceLevel,
      resultsCount,
      timeSpent,
      resumeId,
      resumeFileName,
      downloadPath,
      viewDuration,
      pageUrl,
      featureUsed,
      sessionId
    } = body;

    // Validate required fields
    if (!activityType || !description || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: activityType, description, sessionId' },
        { status: 400 }
      );
    }

    // Validate activity type
    if (!Object.values(ActivityType).includes(activityType)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Get user ID from session (you'll need to modify this based on your auth setup)
    const userId = parseInt(session.user.id || '0');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    await logUserActivity(userId, sessionId, {
      activityType,
      description,
      metadata,
      searchQuery,
      jobCategory,
      skillsSearched,
      experienceLevel,
      resultsCount,
      timeSpent,
      resumeId,
      resumeFileName,
      downloadPath,
      viewDuration,
      pageUrl,
      featureUsed,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const userId = parseInt(session.user.id || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Import getUserAnalytics here to avoid circular imports
    const { getUserAnalytics } = await import('@/lib/analytics');
    const analytics = await getUserAnalytics(userId, days);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}