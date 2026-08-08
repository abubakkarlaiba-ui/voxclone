"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { VoiceProfileCard } from "@/components/voice/VoiceProfileCard";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import type { VoiceProfile } from "@/types";

export default function LibraryPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VoiceProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotification();

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/voices");
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.error?.message || "Failed to load profiles");
      }
    } catch {
      setError("Failed to load voice profiles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/voices");
        const data = await res.json();
        if (!cancelled) {
          if (data.success) setProfiles(data.data);
          else setError(data.error?.message || "Failed to load profiles");
        }
      } catch {
        if (!cancelled) setError("Failed to load voice profiles.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/voices/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        addNotification("success", `Profile "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
      } else {
        addNotification("error", data.error?.message || "Failed to delete");
      }
    } catch {
      addNotification("error", "Failed to delete profile.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, addNotification]);

  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Voice Library</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your voice profiles and samples.
          </p>
        </div>
        <Button onClick={() => router.push("/studio")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner label="Loading profiles..." />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProfiles} />
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          title="No voice profiles yet"
          description="Create your first voice profile to get started with AI voice generation."
          action={<Button onClick={() => router.push("/studio")}>Create Profile</Button>}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-xs text-text-muted">
            <span>{profiles.length} profile{profiles.length !== 1 ? "s" : ""}</span>
            <span className="h-1 w-1 rounded-full bg-border-primary" />
            <span>{profiles.filter((p) => p.status === "ready").length} ready</span>
            <span className="h-1 w-1 rounded-full bg-border-primary" />
            <span>{profiles.reduce((sum, p) => sum + p.samples.length, 0)} total samples</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <VoiceProfileCard
                key={profile.id}
                profile={profile}
                onDelete={(id) => {
                  const p = profiles.find((x) => x.id === id);
                  if (p) setDeleteTarget(p);
                }}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Voice Profile"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove all ${deleteTarget?.samples.length || 0} samples and cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}