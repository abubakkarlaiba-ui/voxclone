"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  data: Uint8Array;
  isRecording: boolean;
  className?: string;
  barCount?: number;
}

export function Waveform({ data, isRecording, className, barCount = 64 }: WaveformProps) {
  const bars = useMemo(() => {
    const result: number[] = [];
    const step = Math.max(1, Math.floor(data.length / barCount));
    for (let i = 0; i < barCount; i++) {
      const idx = Math.min(i * step, data.length - 1);
      result.push(data[idx] ?? 0);
    }
    return result;
  }, [data, barCount]);

  return (
    <div
      className={cn(
        "flex items-end justify-center gap-[2px]",
        className
      )}
      aria-hidden="true"
    >
      {bars.map((value, i) => {
        const normalized = value / 255;
        const height = Math.max(3, normalized * 48);
        return (
          <div
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-all duration-75",
              isRecording
                ? normalized > 0.6
                  ? "bg-accent-primary"
                  : normalized > 0.3
                    ? "bg-accent-primary/70"
                    : "bg-accent-primary/40"
                : "bg-border-secondary"
            )}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
