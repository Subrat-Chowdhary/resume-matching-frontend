import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // If user is authenticated, track page views
  if (token && token.sub) {
    const response = NextResponse.next();
    
    // Add headers for analytics tracking
    response.headers.set('x-user-id', token.sub);
    response.headers.set('x-page-url', pathname);
    response.headers.set('x-timestamp', new Date().toISOString());
    
    return response;
  }

  // Allow access to login and register pages
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  // Redirect to login for protected routes (only analytics and test pages)
  const protectedRoutes = ['/analytics', '/test-analytics'];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};