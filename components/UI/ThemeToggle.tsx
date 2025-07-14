'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div className="h-5 w-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  const themes = [
    { name: 'light', icon: SunIcon, label: 'Light' },
    { name: 'dark', icon: MoonIcon, label: 'Dark' },
    { name: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ];

  return (
    <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {themes.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          onClick={() => setTheme(name)}
          className={`
            p-2 rounded-md transition-all duration-200 group relative
            ${theme === name 
              ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 dark:text-orange-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
          `}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}