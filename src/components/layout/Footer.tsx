import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#090a0f]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">{APP_NAME}</span>
          </div>
          <p className="text-xs text-[#5c6073]">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href={ROUTES.PRIVACY} className="text-xs text-[#5c6073] hover:text-[#8b8fa3] transition-colors">Privacy</Link>
            <Link href={ROUTES.TERMS} className="text-xs text-[#5c6073] hover:text-[#8b8fa3] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
