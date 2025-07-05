import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { checkUsageLimit, incrementUsage } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'search' | 'download';

    if (!type || !['search', 'download'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Use "search" or "download"' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id || '0');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const usageInfo = await checkUsageLimit(userId, type);
    return NextResponse.json(usageInfo);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !['search', 'download'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Use "search" or "download"' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id || '0');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Check if user has remaining quota
    const usageInfo = await checkUsageLimit(userId, type);
    
    if (!usageInfo.allowed) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          remaining: usageInfo.remaining,
          limit: usageInfo.limit
        },
        { status: 429 }
      );
    }

    // Increment usage
    await incrementUsage(userId, type);
    
    // Return updated usage info
    const updatedUsageInfo = await checkUsageLimit(userId, type);
    return NextResponse.json({ 
      success: true,
      usage: updatedUsageInfo
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}