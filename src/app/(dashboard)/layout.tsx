"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="relative min-h-full">
        <AnimatedBackground />
        <FloatingOrbs count={3} className="opacity-60" />
        <div className="relative z-10">{children}</div>
      </div>
    </AppShell>
  );
}
