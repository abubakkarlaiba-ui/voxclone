"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { UserMenu } from "@/components/layout/UserMenu";

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-primary bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={ROUTES.HOME} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-text-primary">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: ROUTES.STUDIO, label: "Voice Studio" },
            { href: ROUTES.TEXT_TO_SPEECH, label: "Text to Speech" },
            { href: ROUTES.LIBRARY, label: "Library" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-bg-elevated md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-primary bg-bg-secondary px-4 py-3 md:hidden">
          {[
            { href: ROUTES.STUDIO, label: "Voice Studio" },
            { href: ROUTES.TEXT_TO_SPEECH, label: "Text to Speech" },
            { href: ROUTES.LIBRARY, label: "Library" },
            { href: ROUTES.HISTORY, label: "History" },
            { href: ROUTES.SETTINGS, label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
