"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { AudioUploader } from "@/components/voice/AudioUploader";
import { VoiceSampleItem } from "@/components/voice/VoiceSampleItem";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { useNotification } from "@/hooks";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { NotificationContainer } from "@/components/ui/Notification";
import { Waveform } from "@/components/voice/Waveform";
import { cn, formatDuration } from "@/lib/utils";
import type { VoiceProfile, VoiceSample, VoiceProfileStatus } from "@/types";

const statusConfig: Record<VoiceProfileStatus, { label: string; className: string; dotClassName: string; description: string }> = {
  draft: {
    label: "Draft",
    className: "bg-text-muted/10 text-text-muted border-border-primary",
    dotClassName: "bg-text-muted",
    description: "Add voice samples and then process to create your AI voice.",
  },
  processing: {
    label: "Processing",
    className: "bg-warning/10 text-warning border-warning/20",
    dotClassName: "bg-warning animate-pulse-soft",
    description: "Your voice samples are being analyzed by AI. This may take a few minutes.",
  },
  ready: {
    label: "Ready",
    className: "bg-success/10 text-success border-success/20",
    dotClassName: "bg-success",
    description: "Your AI voice is ready! Use it to generate speech from text.",
  },
  failed: {
    label: "Failed",
    className: "bg-error/10 text-error border-error/20",
    dotClassName: "bg-error",
    description: "Processing failed. Try re-processing or add more samples.",
  },
};

export default function VoiceProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VoiceSample | null>(null);
  const [isDeletingSample, setIsDeletingSample] = useState(false);
  const [showRecordPanel, setShowRecordPanel] = useState(false);

  const { notifications, addNotification, removeNotification } = useNotification();

  const recorder = useAudioRecorder({
    onRecordingComplete: () => {
      addNotification("success", "Recording complete!");
    },
    onError: (msg) => addNotification("error", msg),
  });

  const fetchProfileData = useCallback(async () => {
    const res = await fetch(`/api/voices/${profileId}`);
    const data = await res.json();
    if (data.success) {
      return data.data as VoiceProfile;
    }
    throw new Error(data.error?.message || "Failed to load profile");
  }, [profileId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchProfileData();
        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load voice profile.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchProfileData]);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchProfileData();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load voice profile.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileData]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) {
      addNotification("warning", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/voices/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        addNotification("success", "Profile updated.");
      } else {
        addNotification("error", data.error?.message || "Failed to update");
      }
    } catch {
      addNotification("error", "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }, [profileId, editName, editDescription, addNotification]);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        // Get audio duration
        const audioUrl = URL.createObjectURL(file);
        const duration = await new Promise<number>((resolve) => {
          const audio = new Audio();
          audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration);
            URL.revokeObjectURL(audioUrl);
          });
          audio.addEventListener("error", () => {
            resolve(0);
            URL.revokeObjectURL(audioUrl);
          });
          audio.src = audioUrl;
        });

        const res = await fetch(`/api/voices/${profileId}/samples`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            duration,
            source: "upload",
          }),
        });
        const data = await res.json();
        if (data.success) {
          addNotification("success", `Sample "${file.name}" added.`);
          void fetchProfile();
        } else {
          addNotification("error", data.error?.message || "Failed to add sample");
        }
      } catch {
        addNotification("error", "Failed to upload sample.");
      } finally {
        setIsUploading(false);
      }
    },
    [profileId, addNotification, fetchProfile]
  );

  const handleRecordAndAdd = useCallback(async () => {
    if (!recorder.recording) return;
    try {
      const res = await fetch(`/api/voices/${profileId}/samples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `recording-${Date.now()}.webm`,
          size: recorder.recording.blob.size,
          mimeType: recorder.recording.blob.type,
          duration: recorder.recording.duration,
          source: "recording",
        }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Recording added as sample.");
        recorder.discardRecording();
        setShowRecordPanel(false);
        void fetchProfile();
      } else {
        addNotification("error", data.error?.message || "Failed to add sample");
      }
    } catch {
      addNotification("error", "Failed to save recording.");
    }
  }, [recorder, profileId, addNotification, fetchProfile]);

  const handleDeleteSample = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeletingSample(true);
    try {
      const res = await fetch(`/api/voices/${profileId}/samples?sampleId=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Sample deleted.");
        setDeleteTarget(null);
        void fetchProfile();
      } else {
        addNotification("error", data.error?.message || "Failed to delete sample");
      }
    } catch {
      addNotification("error", "Failed to delete sample.");
    } finally {
      setIsDeletingSample(false);
    }
  }, [profileId, deleteTarget, addNotification, fetchProfile]);

  const handleProcess = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/voices/${profileId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        addNotification("info", "Voice processing started. This may take a few minutes.");
      } else {
        addNotification("error", data.error?.message || "Failed to start processing");
      }
    } catch {
      addNotification("error", "Failed to start processing.");
    } finally {
      setIsProcessing(false);
    }
  }, [profileId, addNotification]);

  const handleDeleteProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/voices/${profileId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addNotification("success", "Profile deleted.");
        router.push("/library");
      } else {
        addNotification("error", data.error?.message || "Failed to delete");
      }
    } catch {
      addNotification("error", "Failed to delete profile.");
    }
  }, [profileId, addNotification, router]);

  // ---------- LOADING ----------
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <LoadingSpinner label="Loading profile..." />
      </div>
    );
  }

  // ---------- ERROR ----------
  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <ErrorState message={error || "Profile not found"} onRetry={fetchProfile} />
      </div>
    );
  }

  const status = statusConfig[profile.status];
  const canAddSamples = profile.status === "draft" || profile.status === "failed";
  const canProcess = profile.samples.length > 0 && (profile.status === "draft" || profile.status === "failed");

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/library")}
        className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Library
      </button>

      {/* Profile Header */}
      <Card variant="glass" className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    label="Voice Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <Textarea
                    label="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile} isLoading={isSaving}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-text-primary">{profile.name}</h1>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        status.className
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClassName)} />
                      {status.label}
                    </span>
                  </div>
                  {profile.description && (
                    <p className="text-sm text-text-secondary">{profile.description}</p>
                  )}
                  <p className="mt-2 text-xs text-text-muted">{status.description}</p>
                </>
              )}
            </div>

            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditName(profile.name);
                  setEditDescription(profile.description);
                  setIsEditing(true);
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
            <span>{profile.samples.length} sample{profile.samples.length !== 1 ? "s" : ""}</span>
            <span className="h-1 w-1 rounded-full bg-border-primary" />
            <span>{formatDuration(profile.totalDuration)} total</span>
            <span className="h-1 w-1 rounded-full bg-border-primary" />
            <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
            {profile.processedAt && (
              <>
                <span className="h-1 w-1 rounded-full bg-border-primary" />
                <span>Processed {new Date(profile.processedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>

          {/* Error banner */}
          {profile.status === "failed" && profile.errorMessage && (
            <div className="mt-4 rounded-lg bg-error/5 border border-error/10 px-4 py-3">
              <p className="text-sm text-error">{profile.errorMessage}</p>
            </div>
          )}

          {/* Processing banner */}
          {profile.status === "processing" && (
            <div className="mt-4 rounded-lg bg-warning/5 border border-warning/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-warning" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-warning">AI voice training in progress...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Samples Section */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <div className="flex-1">
            <CardTitle>Voice Samples</CardTitle>
            <CardDescription>
              {canAddSamples
                ? "Add at least one sample. More samples improve AI voice quality."
                : "Your collected voice samples."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample list */}
          {profile.samples.length > 0 ? (
            <div className="space-y-2">
              {profile.samples.map((sample) => (
                <VoiceSampleItem
                  key={sample.id}
                  sample={sample}
                  onDelete={canAddSamples ? () => setDeleteTarget(sample) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-primary bg-bg-tertiary/50 py-8 text-center">
              <svg className="mx-auto mb-3 h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sm text-text-secondary">No samples yet</p>
              <p className="mt-1 text-xs text-text-muted">Record or upload your first voice sample.</p>
            </div>
          )}

          {/* Upload & Record buttons */}
          {canAddSamples && (
            <div className="flex gap-3">
              <AudioUploader
                onUpload={handleUpload}
                isUploading={isUploading}
                className="flex-1"
              />
            </div>
          )}

          {canAddSamples && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowRecordPanel(!showRecordPanel)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {showRecordPanel ? "Hide Recorder" : "Record New Sample"}
            </Button>
          )}

          {/* Inline recorder */}
          {showRecordPanel && canAddSamples && (
            <Card variant="elevated" className="animate-fade-in-up">
              <CardContent className="py-6">
                <div className="flex flex-col items-center">
                  {recorder.permission !== "granted" && recorder.state === "idle" && (
                    <div className="mb-4 text-center">
                      <p className="text-sm text-text-secondary mb-3">Allow microphone to record a sample</p>
                      <Button onClick={() => recorder.requestPermission()} size="sm">
                        Enable Microphone
                      </Button>
                    </div>
                  )}

                  {recorder.permission === "granted" && recorder.state === "idle" && (
                    <Button onClick={recorder.startRecording} className="rounded-full">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Start Recording
                    </Button>
                  )}

                  {(recorder.state === "recording" || recorder.state === "paused") && (
                    <div className="w-full">
                      <div className="mb-3 flex items-center justify-center gap-4">
                        <span className={cn("text-xs font-medium", recorder.state === "recording" ? "text-error" : "text-warning")}>
                          {recorder.state === "recording" ? "Recording" : "Paused"}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-text-primary">
                          {formatDuration(recorder.duration)}
                        </span>
                      </div>
                      <Waveform data={recorder.waveform} isRecording={recorder.state === "recording"} barCount={48} className="h-8 mb-4" />
                      <div className="flex justify-center gap-2">
                        {recorder.isPauseSupported && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={recorder.state === "recording" ? recorder.pauseRecording : recorder.resumeRecording}
                          >
                            {recorder.state === "recording" ? "Pause" : "Resume"}
                          </Button>
                        )}
                        <Button size="sm" variant="danger" onClick={recorder.stopRecording}>
                          Stop
                        </Button>
                      </div>
                    </div>
                  )}

                  {recorder.state === "stopped" && recorder.recording && (
                    <div className="w-full text-center">
                      <p className="mb-2 text-sm text-text-secondary">
                        {formatDuration(recorder.recording.duration)} recorded
                      </p>
                      <div className="mb-4 flex justify-center gap-2">
                        <Button size="sm" onClick={handleRecordAndAdd}>
                          Add as Sample
                        </Button>
                        <Button size="sm" variant="outline" onClick={recorder.discardRecording}>
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canProcess && (
          <Button onClick={handleProcess} isLoading={isProcessing}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Process Voice with AI
          </Button>
        )}

        {profile.status === "ready" && (
          <Button onClick={() => router.push(`/text-to-speech?voice=${profile.id}`)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Generate Speech
          </Button>
        )}

        <Button variant="danger" onClick={handleDeleteProfile}>
          Delete Profile
        </Button>
      </div>

      {/* Delete sample modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Sample"
        description={`Delete "${deleteTarget?.filename}"? This cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" isLoading={isDeletingSample} onClick={handleDeleteSample}>Delete</Button>
        </div>
      </Modal>

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
