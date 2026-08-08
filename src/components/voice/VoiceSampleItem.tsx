"use client";

import { Button } from "@/components/ui/Button";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { cn, formatDuration, formatFileSize } from "@/lib/utils";
import type { VoiceSample } from "@/types";

interface VoiceSampleItemProps {
  sample: VoiceSample;
  onDelete?: (sampleId: string) => void;
  className?: string;
}

export function VoiceSampleItem({ sample, onDelete, className }: VoiceSampleItemProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border-primary bg-bg-tertiary p-3", className)}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
        <svg className="h-4 w-4 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-text-primary">{sample.filename}</p>
        <p className="text-[10px] text-text-muted">
          {formatDuration(sample.duration)} &middot; {formatFileSize(sample.size)} &middot; {sample.source}
        </p>
      </div>
      <div className="flex-shrink-0">
        <AudioPlayer src={sample.url || "#"} />
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onDelete(sample.id)}
          className="text-text-muted hover:text-error"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      )}
    </div>
  );
}
