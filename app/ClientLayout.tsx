// File: /opt/resume-matching-system/frontend/app/ClientLayout.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AnalyticsProvider } from "@/lib/providers/AnalyticsProvider";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </SessionProvider>
  );
}
