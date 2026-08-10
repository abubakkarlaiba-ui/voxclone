"use client";

import { cn } from "@/lib/utils";

interface EqualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export function Equalizer({ isPlaying, barCount = 5, className }: EqualizerProps) {
  return (
    <div
      className={cn("flex items-end gap-[2px]", className)}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-current transition-colors",
            isPlaying ? "eq-bar" : "eq-bar-paused"
          )}
          style={{
            animationDelay: `${i * 0.12}s`,
            height: isPlaying ? undefined : "4px",
          }}
        />
      ))}
    </div>
  );
}
