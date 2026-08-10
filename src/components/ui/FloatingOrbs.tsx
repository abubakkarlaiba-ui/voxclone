"use client";

import { cn } from "@/lib/utils";

interface FloatingOrbsProps {
  className?: string;
  count?: number;
}

const orbColors = [
  "bg-[#6366f1]/[0.07]",
  "bg-[#8b5cf6]/[0.05]",
  "bg-[#22d3ee]/[0.04]",
  "bg-[#6366f1]/[0.05]",
  "bg-[#a78bfa]/[0.04]",
];

const orbSizes = [
  "h-[400px] w-[400px]",
  "h-[300px] w-[300px]",
  "h-[350px] w-[350px]",
  "h-[250px] w-[250px]",
  "h-[200px] w-[200px]",
];

const orbPositions = [
  "left-[10%] top-[15%]",
  "right-[15%] top-[25%]",
  "left-[40%] bottom-[20%]",
  "right-[30%] bottom-[30%]",
  "left-[20%] bottom-[40%]",
];

const floatAnimations = [
  "animate-float-1",
  "animate-float-2",
  "animate-float-3",
  "animate-float-1",
  "animate-float-2",
];

export function FloatingOrbs({ className, count = 5 }: FloatingOrbsProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full blur-[100px]",
            orbColors[i % orbColors.length],
            orbSizes[i % orbSizes.length],
            orbPositions[i % orbPositions.length],
            floatAnimations[i % floatAnimations.length]
          )}
        />
      ))}
    </div>
  );
}
