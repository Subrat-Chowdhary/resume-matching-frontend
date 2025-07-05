import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSystemAnalytics } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role (you'll need to implement role checking)
    // For now, we'll allow all authenticated users
    // TODO: Implement proper role-based access control
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const systemAnalytics = await getSystemAnalytics(days);
    return NextResponse.json(systemAnalytics);
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}