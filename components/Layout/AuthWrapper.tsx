'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ModernLayout from './ModernLayout';
import PublicLayout from './PublicLayout';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { status } = useSession();
  const pathname = usePathname();

  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  // For public routes, use PublicLayout
  if (isPublicRoute) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // For protected routes, use ModernLayout (which handles auth internally)
  return <ModernLayout>{children}</ModernLayout>;
}