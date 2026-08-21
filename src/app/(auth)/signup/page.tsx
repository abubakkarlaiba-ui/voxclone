"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { NotificationContainer } from "@/components/ui/Notification";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useNotification } from "@/hooks";
import { APP_NAME } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      addNotification("error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      addNotification("error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", `Welcome, ${data.data.name}!`);
        setTimeout(() => router.push("/studio"), 500);
      } else {
        addNotification("error", data.error?.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      addNotification("error", "Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password, confirmPassword, addNotification, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090a0f] px-4">
      <AnimatedBackground />
      <div className="eleven-card p-8 relative z-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Create your {APP_NAME} account</h1>
        <p className="mt-1.5 text-sm text-[#8b8fa3]">Get started with AI voice generation.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Morgan"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn-generate w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold"
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : null}
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#8b8fa3]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#818cf8] hover:text-[#a5b4fc] transition-colors">
          Sign in
        </Link>
      </p>
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
    </div>
  );
}
