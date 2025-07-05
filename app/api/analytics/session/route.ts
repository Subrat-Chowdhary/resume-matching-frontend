import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createUserSession, endUserSession, getClientIP, parseUserAgent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'start' or 'end'

    const userId = parseInt(session.user.id || '0');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    if (action === 'start') {
      // Get client information
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const { device, browser } = parseUserAgent(userAgent);

      // You can integrate with a geolocation service here
      const location = 'Unknown'; // TODO: Implement geolocation

      const sessionId = await createUserSession(userId, {
        ipAddress,
        userAgent,
        location,
        device,
        browser,
      });

      return NextResponse.json({ sessionId, success: true });
    } else if (action === 'end') {
      const { sessionId } = body;
      
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required for ending session' },
          { status: 400 }
        );
      }

      await endUserSession(sessionId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "end"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}