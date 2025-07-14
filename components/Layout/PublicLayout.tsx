'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '@/public/ahom.png';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  HeartIcon,
  CubeIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from '@/components/UI/ThemeToggle';

interface PublicLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  requireAuth?: boolean;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation items
  const navItems: NavItem[] = [
    { name: 'Upload', icon: ArrowUpTrayIcon, path: '/upload' },
    { name: 'Search', icon: MagnifyingGlassIcon, path: '/search' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics', badge: 3, requireAuth: true },
    { name: 'Health Check', icon: HeartIcon, path: '/health' },
    // { name: 'MinIO Storage', icon: CubeIcon, path: '/minio' },
  ];

  const handleNavigation = (path: string, requireAuth?: boolean) => {
    if (requireAuth && status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(path)}`);
      return;
    }

    if (path === '/minio') {
      window.open('http://localhost:9001/browser/resumes', '_blank');
    } else {
      router.push(path);
    }
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    signOut({ callbackUrl: 'http://localhost:3000' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile && !sidebarOpen ? '-100%' : '0%',
          width: isMobile ? '280px' : '280px'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-70 bg-white dark:bg-gray-800 shadow-xl
          flex flex-col border-r border-gray-200 dark:border-gray-700
          ${isMobile ? 'lg:translate-x-0' : ''}
        `}
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Image src={logo} width={200} height={80} alt="Logo" className="rounded-lg" />
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">
                <span className="text-orange-600 dark:text-orange-400">AI</span> Resume Matcher
              </h1>
              
            </div>
          </div>
          
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || 
              (item.path === '/analytics' && pathname.startsWith('/analytics')) ||
              (item.path === '/search' && pathname.startsWith('/search'));
            
            const isDisabled = item.requireAuth && status !== 'authenticated';
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path, item.requireAuth)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-left
                  font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-orange-600 dark:bg-orange-500 text-white shadow-lg shadow-orange-600/25' 
                    : isDisabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-5 w-5 ${
                    isActive 
                      ? 'text-white' 
                      : isDisabled 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                  }`} />
                  <span className="font-semibold">{item.name}</span>
                  {isDisabled && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      Login Required
                    </span>
                  )}
                </div>
                
                {item.badge && !isDisabled && (
                  <span className={`
                    px-2 py-1 text-xs font-bold rounded-full
                    ${isActive ? 'bg-white text-orange-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {status === 'authenticated' && session ? (
            <>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                <UserCircleIcon className="h-10 w-10 text-gray-600 dark:text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {session.user?.email}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {session.user?.role || 'User'}
                  </p>
                </div>
              </div>



              <div className="mt-4 space-y-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Sign in to access all features
                </p>
                <button
                  onClick={handleLogin}
                  className="btn-primary w-full py-2 px-4 rounded-lg text-sm font-semibold"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'w-full' : 'lg:ml-0'}`}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 lg:hidden"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              )}
              
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {pathname === '/analytics' && 'Analytics Dashboard'}
                  {pathname === '/search' && 'Resume Search'}
                  {pathname === '/upload' && 'Upload Resumes'}
                  {pathname === '/health' && 'System Health'}
                  {pathname === '/test-analytics' && 'Analytics Testing'}
                  {pathname === '/' && 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pathname === '/analytics' && 'Monitor your platform usage and insights'}
                  {pathname === '/search' && 'Find the perfect candidates'}
                  {pathname === '/upload' && 'Add new resumes to the database'}
                  {pathname === '/health' && 'System status and performance'}
                  {pathname === '/test-analytics' && 'Test analytics functionality'}
                  {pathname === '/' && 'Welcome to your AI-powered resume platform'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {status === 'authenticated' && (
                <>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 relative">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-600 dark:bg-orange-500 rounded-full"></span>
                  </button>
                  
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-black dark:text-white">{session?.user?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{session?.user?.role || 'User'}</p>
                  </div>
                </>
              )}
              
              {status !== 'authenticated' && (
                <button
                  onClick={handleLogin}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}