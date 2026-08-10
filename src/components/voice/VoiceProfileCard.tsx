"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useNotification } from "@/hooks";
import { cn, formatDuration } from "@/lib/utils";
import type { VoiceProfile, VoiceProfileStatus } from "@/types";

interface VoiceProfileCardProps {
  profile: VoiceProfile;
  isSelected?: boolean;
  onSelect?: (profileId: string) => void;
  onDeleted?: (profileId: string) => void;
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

export function VoiceProfileCard({
  profile,
  isSelected = false,
  onSelect,
  onDeleted,
  className,
}: VoiceProfileCardProps) {
  const router = useRouter();
  const { addNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = statusConfig[profile.status];
  const firstSampleUrl = profile.samples[0]?.url;

  const handleSaveName = useCallback(async () => {
    if (!editName.trim() || editName.trim() === profile.name) {
      setIsEditing(false);
      setEditName(profile.name);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/voices/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Voice renamed.");
        setIsEditing(false);
      } else {
        addNotification("error", data.error?.message || "Failed to rename");
        setEditName(profile.name);
      }
    } catch {
      addNotification("error", "Failed to rename voice.");
      setEditName(profile.name);
    } finally {
      setIsSaving(false);
    }
  }, [editName, profile.id, profile.name, addNotification]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/voices/${profile.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addNotification("success", `Voice "${profile.name}" deleted.`);
        onDeleted?.(profile.id);
      } else {
        addNotification("error", data.error?.message || "Failed to delete");
      }
    } catch {
      addNotification("error", "Failed to delete voice.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [profile.id, profile.name, addNotification, onDeleted]);

  const handleSelect = useCallback(() => {
    onSelect?.(profile.id);
  }, [profile.id, onSelect]);

  return (
    <>
      <Card
        variant="glass"
        className={cn(
          "group transition-all duration-200 hover:border-border-secondary",
          isSelected && "border-accent-primary ring-1 ring-accent-primary/20",
          className
        )}
      >
        <CardContent className="flex flex-col">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setIsEditing(false);
                        setEditName(profile.name);
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="xs" onClick={handleSaveName} isLoading={isSaving}>
                      Save
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-text-primary">{profile.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditName(profile.name);
                      setIsEditing(true);
                    }}
                    className="flex-shrink-0 rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-bg-elevated hover:text-text-secondary group-hover:opacity-100"
                    aria-label="Rename"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
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
          <div className="mb-3 flex items-center gap-3 text-[11px] text-text-muted">
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

          {/* Preview audio */}
          {firstSampleUrl && profile.status === "ready" && (
            <div className="mb-3">
              <AudioPlayer src={firstSampleUrl} compact showVolume={false} />
            </div>
          )}

          {/* Error message */}
          {profile.status === "failed" && profile.errorMessage && (
            <div className="mb-3 rounded-lg bg-error/5 border border-error/10 px-3 py-2">
              <p className="text-xs text-error">{profile.errorMessage}</p>
            </div>
          )}

          {/* Processing indicator */}
          {profile.status === "processing" && (
            <div className="mb-3 rounded-lg bg-warning/5 border border-warning/10 px-3 py-2">
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
          <div className="mt-auto flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {isSelected ? (
              <Button size="xs" disabled>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Selected
              </Button>
            ) : (
              <Button
                size="xs"
                disabled={profile.status !== "ready"}
                onClick={handleSelect}
              >
                Select
              </Button>
            )}
            <Button
              size="xs"
              variant="secondary"
              onClick={() => router.push(`/library/${profile.id}`)}
            >
              Details
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="ml-auto text-text-muted hover:text-error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Voice Profile"
        description={`Are you sure you want to delete "${profile.name}"? This will remove ${profile.samples.length} sample${profile.samples.length !== 1 ? "s" : ""} and cannot be undone. Generated audio in your history will not be affected.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
