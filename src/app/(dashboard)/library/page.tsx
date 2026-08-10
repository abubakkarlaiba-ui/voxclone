"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { VoiceProfileCard } from "@/components/voice/VoiceProfileCard";
import { CreateVoiceProfileModal } from "@/components/voice/CreateVoiceProfileModal";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import type { VoiceProfile } from "@/types";

export default function LibraryPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
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
    let active = true;
    (async () => {
      if (active) await fetchProfiles();
    })();
    return () => { active = false; };
  }, [fetchProfiles]);

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const readyCount = profiles.filter((p) => p.status === "ready").length;
  const totalSamples = profiles.reduce((sum, p) => sum + p.samples.length, 0);

  const handleSelect = useCallback((profileId: string) => {
    setSelectedVoiceId(profileId);
    addNotification("success", "Voice selected for TTS.");
  }, [addNotification]);

  const handleDeleted = useCallback((profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (selectedVoiceId === profileId) setSelectedVoiceId(null);
  }, [selectedVoiceId]);

  const handleCreated = useCallback((profileId: string) => {
    fetchProfiles();
    setSelectedVoiceId(profileId);
  }, [fetchProfiles]);

  return (
    <div className="py-8 page-enter">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Voice Library</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your voice profiles and samples.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Voice
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner label="Loading voices..." />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={fetchProfiles} />
      )}

      {/* Empty */}
      {!isLoading && !error && profiles.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          title="No voice profiles yet"
          description="Create your first voice profile to get started with AI voice generation."
          action={<Button onClick={() => setShowCreateModal(true)}>Create Voice</Button>}
        />
      )}

      {/* Content */}
      {!isLoading && !error && profiles.length > 0 && (
        <>
          {/* Stats + Search */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{profiles.length} voice{profiles.length !== 1 ? "s" : ""}</span>
              <span className="h-1 w-1 rounded-full bg-border-primary" />
              <span>{readyCount} ready</span>
              <span className="h-1 w-1 rounded-full bg-border-primary" />
              <span>{totalSamples} total sample{totalSamples !== 1 ? "s" : ""}</span>
            </div>
            <div className="relative max-w-xs">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search voices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border-primary bg-bg-tertiary py-2 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
              />
            </div>
          </div>

          {/* No search results */}
          {filtered.length === 0 && (
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title="No voices found"
              description={`No voices match "${search}". Try a different search.`}
            />
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((profile) => (
                <VoiceProfileCard
                  key={profile.id}
                  profile={profile}
                  isSelected={selectedVoiceId === profile.id}
                  onSelect={handleSelect}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}

          {/* Selected voice CTA */}
          {selectedVoiceId && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => router.push(`/text-to-speech?voice=${selectedVoiceId}`)}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Use Selected Voice for TTS
              </Button>
            </div>
          )}
        </>
      )}

      <CreateVoiceProfileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
