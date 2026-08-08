"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatDuration } from "@/lib/utils";
import type { VoiceProfile } from "@/types";

interface VoiceCardProps {
  voice: VoiceProfile;
  onUse?: (voiceId: string) => void;
  onDelete?: (voiceId: string) => void;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ready: "bg-success/10 text-success border-success/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  draft: "bg-text-muted/10 text-text-muted border-border-primary",
  failed: "bg-error/10 text-error border-error/20",
};

export function VoiceCard({ voice, onUse, onDelete, className }: VoiceCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "flex flex-col cursor-pointer transition-all duration-200 hover:border-border-secondary",
        className
      )}
      onClick={() => router.push(`/library/${voice.id}`)}
    >
      <CardContent className="flex-1">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-base font-semibold text-text-primary">{voice.name}</h3>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
              statusStyles[voice.status]
            )}
          >
            {voice.status}
          </span>
        </div>
        {voice.description && (
          <p className="mb-3 text-sm text-text-secondary">{voice.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>{formatDuration(voice.totalDuration)}</span>
          <span>{voice.samples.length} sample{voice.samples.length !== 1 ? "s" : ""}</span>
        </div>
      </CardContent>
      <CardFooter>
        {onUse && (
          <Button
            onClick={(e) => { e.stopPropagation(); onUse(voice.id); }}
            size="sm"
            disabled={voice.status !== "ready"}
          >
            Use Voice
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(voice.id); }}
            variant="ghost"
            size="sm"
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
