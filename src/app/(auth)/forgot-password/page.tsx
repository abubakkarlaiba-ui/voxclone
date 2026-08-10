"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useNotification } from "@/hooks";

export default function ForgotPasswordPage() {
  const { addNotification } = useNotification();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    addNotification("success", "If an account exists with that email, a reset link has been sent.");
    setIsSubmitting(false);
  }, [email, addNotification]);

  return (
    <div className="eleven-card p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Reset your password</h1>
        <p className="mt-1.5 text-sm text-[#8b8fa3]">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="mb-4 rounded-xl bg-[#22c55e]/10 p-4 border border-[#22c55e]/20">
            <p className="text-sm text-[#22c55e]">Reset link sent! Check your email.</p>
          </div>
          <Link href="/login">
            <Button variant="secondary" fullWidth>Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-generate w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
          >
            {isSubmitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Send Reset Link
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#8b8fa3]">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
