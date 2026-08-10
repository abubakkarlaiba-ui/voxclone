"use client";

import Link from "next/link";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <Link href={ROUTES.HOME} className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[0_0_20px_rgba(99,102,241,0.3)]">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </div>
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight text-white">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
