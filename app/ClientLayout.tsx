// File: /opt/resume-matching-system/frontend/app/ClientLayout.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AnalyticsProvider } from "@/lib/providers/AnalyticsProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
