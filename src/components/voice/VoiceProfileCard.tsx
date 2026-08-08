"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatDuration } from "@/lib/utils";
import type { VoiceProfile, VoiceProfileStatus } from "@/types";

interface VoiceProfileCardProps {
  profile: VoiceProfile;
  onDelete?: (profileId: string) => void;
  className?: string;
}

const statusConfig: Record<VoiceProfileStatus, { label: string; className: string; dotClassName: string }> = {
  draft: {
    label: "Draft",
    className: "bg-text-muted/10 text-text-muted border-border-primary",
    dotClassName: "bg-text-muted",
  },
  processing: {
    label: "Processing",
    className: "bg-warning/10 text-warning border-warning/20",
    dotClassName: "bg-warning animate-pulse-soft",
  },
  ready: {
    label: "Ready",
    className: "bg-success/10 text-success border-success/20",
    dotClassName: "bg-success",
  },
  failed: {
    label: "Failed",
    className: "bg-error/10 text-error border-error/20",
    dotClassName: "bg-error",
  },
};

export function VoiceProfileCard({ profile, onDelete, className }: VoiceProfileCardProps) {
  const router = useRouter();
  const status = statusConfig[profile.status];

  return (
    <Card
      variant="glass"
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:border-border-secondary",
        className
      )}
      onClick={() => router.push(`/library/${profile.id}`)}
    >
      <CardContent className="flex flex-col">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-text-primary">{profile.name}</h3>
            {profile.description && (
              <p className="mt-0.5 truncate text-xs text-text-muted">{profile.description}</p>
            )}
          </div>
          <span
            className={cn(
              "ml-2 inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              status.className
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClassName)} />
            {status.label}
          </span>
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {profile.samples.length} sample{profile.samples.length !== 1 ? "s" : ""}
          </span>
          <span className="h-1 w-1 rounded-full bg-border-primary" />
          <span>{formatDuration(profile.totalDuration)}</span>
          <span className="h-1 w-1 rounded-full bg-border-primary" />
          <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Error message */}
        {profile.status === "failed" && profile.errorMessage && (
          <div className="mb-4 rounded-lg bg-error/5 border border-error/10 px-3 py-2">
            <p className="text-xs text-error">{profile.errorMessage}</p>
          </div>
        )}

        {/* Processing indicator */}
        {profile.status === "processing" && (
          <div className="mb-4 rounded-lg bg-warning/5 border border-warning/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin text-warning" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-warning">AI voice is being trained...</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            disabled={profile.status !== "ready"}
            onClick={() => router.push(`/text-to-speech?voice=${profile.id}`)}
          >
            Use
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/library/${profile.id}`)}
          >
            Details
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-text-muted hover:text-error"
              onClick={() => onDelete(profile.id)}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
