"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FloatingOrbs } from "@/components/ui/FloatingOrbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="relative min-h-full">
        {/* Animated background layer */}
        <FloatingOrbs count={3} className="opacity-60" />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Subtle radial glow in top-right */}
        <div className="pointer-events-none fixed right-0 top-0 h-[600px] w-[600px] rounded-full bg-[#6366f1]/[0.03] blur-[150px]" />
        <div className="pointer-events-none fixed bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-[#8b5cf6]/[0.02] blur-[150px]" />
        <div className="relative z-10">{children}</div>
      </div>
    </AppShell>
  );
}
