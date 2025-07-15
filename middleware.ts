import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;
  
  // Debug logging (remove in production)
  // console.log(`[Middleware] Path: ${pathname}, Token exists: ${!!token}, User ID: ${token?.sub || 'none'}`);

  // Skip middleware for static files and API auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/download-resume') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  
  // If user is not authenticated
  if (!token || !token.sub) {
    // Allow access to public routes
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Redirect to login for all other routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but trying to access login/register, redirect to dashboard
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // User is authenticated and accessing protected routes
  const response = NextResponse.next();
  
  // Add headers for analytics tracking
  response.headers.set('x-user-id', token.sub);
  response.headers.set('x-page-url', pathname);
  response.headers.set('x-timestamp', new Date().toISOString());
  
  return response;
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