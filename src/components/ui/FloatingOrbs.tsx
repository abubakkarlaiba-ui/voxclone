"use client";

import { cn } from "@/lib/utils";

interface FloatingOrbsProps {
  className?: string;
  count?: number;
}

const orbs = [
  { color: "rgba(99,102,241,0.25)", size: 500, x: "10%", y: "15%", anim: "animate-float-1" },
  { color: "rgba(139,92,246,0.20)", size: 400, x: "70%", y: "20%", anim: "animate-float-2" },
  { color: "rgba(34,211,238,0.15)", size: 350, x: "40%", y: "65%", anim: "animate-float-3" },
  { color: "rgba(99,102,241,0.18)", size: 300, x: "75%", y: "60%", anim: "animate-float-1" },
  { color: "rgba(167,139,250,0.15)", size: 280, x: "20%", y: "75%", anim: "animate-float-2" },
];

export function FloatingOrbs({ className, count = 5 }: FloatingOrbsProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {orbs.slice(0, count).map((orb, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full", orb.anim)}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
      ))}
    </div>
  );
}
