"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border-primary bg-bg-primary/80 backdrop-blur-xl px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 text-xs font-semibold text-accent-primary">
              AM
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
