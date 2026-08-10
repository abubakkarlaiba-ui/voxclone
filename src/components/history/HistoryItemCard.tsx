"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatDuration } from "@/lib/utils";
import type { HistoryItem } from "@/types";

interface HistoryItemCardProps {
  item: HistoryItem;
  onDelete: (id: string) => void;
}

export function HistoryItemCard({ item, onDelete }: HistoryItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onDelete(item.id);
      }
    } catch {
      setIsDeleting(false);
    } finally {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <>
      <Card variant="glass" className="group">
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-primary/10">
              <svg className="h-5 w-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs font-medium text-text-primary">{item.voiceName}</span>
                <span className="text-text-muted">&middot;</span>
                <span className="text-[11px] text-text-muted">{timeAgo}</span>
              </div>
              <p className="mb-2 line-clamp-2 text-sm text-text-secondary italic">&quot;{item.text}&quot;</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(item.duration)}
                </span>
                <span className="uppercase">{item.format}</span>
                {item.options.speed && item.options.speed !== 1 && (
                  <span>Speed: {item.options.speed.toFixed(1)}x</span>
                )}
              </div>
            </div>

            {/* Player + actions */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
              <div className="w-full flex-1 sm:w-56 sm:flex-shrink-0">
                <AudioPlayer
                  src={item.audioUrl}
                  compact
                  showDownload
                  downloadFilename={`voxclone-${item.id}.${item.format}`}
                />
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-error sm:ml-0"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Generated Audio"
        description="This will permanently delete this generated audio file. This cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
