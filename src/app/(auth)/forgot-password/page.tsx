"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
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
    // Simulate sending reset email (no real email service)
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    addNotification("success", "If an account exists with that email, a reset link has been sent.");
    setIsSubmitting(false);
  }, [email, addNotification]);

  return (
    <Card variant="glass">
      <CardContent className="py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Reset your password</h1>
          <p className="mt-1 text-sm text-text-secondary">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mb-4 rounded-xl bg-success/10 p-4">
              <p className="text-sm text-success">Reset link sent! Check your email.</p>
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
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-accent-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
