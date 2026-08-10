"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Waveform } from "@/components/voice/Waveform";
import { formatDuration } from "@/lib/utils";
import { formatBytes } from "@/lib/audio";
import type { VoiceProfile } from "@/types";

export default function StudioPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<VoiceProfile | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const recorder = useAudioRecorder({
    onRecordingComplete: () => {
      addNotification("success", "Recording complete! Review your audio below.");
    },
    onError: (msg) => {
      addNotification("error", msg);
    },
  });

  const handleRequestPermission = useCallback(async () => {
    setHasInteracted(true);
    await recorder.requestPermission();
  }, [recorder]);

  const handleStartRecording = useCallback(async () => {
    setHasInteracted(true);
    if (recorder.permission !== "granted") {
      await recorder.requestPermission();
    }
    await recorder.startRecording();
  }, [recorder]);

  const handleSave = useCallback(async () => {
    if (!recorder.recording || !voiceName.trim()) {
      addNotification("warning", "Please enter a name for your voice.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: voiceName.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        addNotification("error", data.error?.message || "Failed to save");
        return;
      }
      const profile: VoiceProfile = data.data;

      const sampleRes = await fetch(`/api/voices/${profile.id}/samples`, {
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
      const sampleData = await sampleRes.json();
      if (!sampleData.success) {
        addNotification("error", sampleData.error?.message || "Failed to save recording");
        return;
      }

      profile.samples = [sampleData.data];
      profile.totalDuration = sampleData.data.duration;
      setSavedProfile(profile);
      addNotification("success", "Voice profile saved!");
    } catch {
      addNotification("error", "Failed to save voice profile.");
    } finally {
      setIsSaving(false);
    }
  }, [recorder.recording, voiceName, description, addNotification]);

  const handleRecordAgain = useCallback(() => {
    recorder.discardRecording();
    setVoiceName("");
    setDescription("");
  }, [recorder]);

  const handleDiscard = useCallback(() => {
    recorder.discardRecording();
    setVoiceName("");
    setDescription("");
  }, [recorder]);

  const handleSaveAndRecordAnother = useCallback(async () => {
    await handleSave();
    if (voiceName.trim()) {
      recorder.discardRecording();
      setVoiceName("");
      setDescription("");
    }
  }, [handleSave, recorder, voiceName]);

  // ---------- RENDER: SAVED SUCCESS ----------
  if (savedProfile) {
    return (
      <div className="mx-auto max-w-xl py-8 page-enter">
        <Card variant="glass">
          <CardContent className="flex flex-col items-center py-14">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 animate-check-pop">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-text-primary animate-fade-in-up">Voice Saved</h2>
            <p className="mb-8 text-center text-sm text-text-secondary animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              &quot;{savedProfile.name}&quot; has been saved. You can now use it for text-to-speech.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => { setSavedProfile(null); }}>Record Another</Button>
              <Button variant="outline" onClick={() => router.push("/library")}>
                Go to Library
              </Button>
            </div>
          </CardContent>
        </Card>
        <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
      </div>
    );
  }

  // ---------- RENDER: UNSUPPORTED BROWSER ----------
  if (recorder.permission === "unsupported") {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Voice Studio</h1>
          <p className="mt-1 text-sm text-text-secondary">Record your voice to create an AI clone.</p>
        </div>
        <Card variant="glass">
          <CardContent className="flex flex-col items-center py-14">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <svg className="h-8 w-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">Browser Not Supported</h2>
            <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
              Your browser does not support audio recording. Please use a modern browser like
              Chrome, Firefox, Edge, or Safari to record your voice.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- RENDER: PERMISSION DENIED ----------
  if (recorder.permission === "denied") {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Voice Studio</h1>
          <p className="mt-1 text-sm text-text-secondary">Record your voice to create an AI clone.</p>
        </div>
        <Card variant="glass">
          <CardContent className="flex flex-col items-center py-14">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
              <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">Microphone Access Denied</h2>
            <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
              Microphone permission was denied. To record your voice, please allow microphone
              access in your browser settings and refresh the page.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRequestPermission}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/")}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
        <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
      </div>
    );
  }

  // ---------- RENDER: MAIN STUDIO ----------
  const isIdle = recorder.state === "idle" || recorder.state === "stopped";
  const isRecording = recorder.state === "recording";
  const isPaused = recorder.state === "paused";
  const isStopped = recorder.state === "stopped";
  const progress = (recorder.duration / recorder.maxDuration) * 100;

  return (
    <div className="mx-auto max-w-2xl py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Voice Studio</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Record a high-quality voice sample to create your AI voice clone.
        </p>
      </div>

      {/* Recording Card */}
      <Card variant="glass" className="mb-6">
        <CardContent className="flex flex-col items-center py-10">
          {/* Permission request state */}
          {recorder.permission === "idle" && !hasInteracted && (
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10">
                <svg className="h-10 w-10 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">Enable Microphone</h3>
              <p className="mb-6 max-w-xs text-sm text-text-secondary">
                We need access to your microphone to record your voice. Your audio stays in your browser.
              </p>
              <Button onClick={handleRequestPermission} size="lg">
                Allow Microphone Access
              </Button>
            </div>
          )}

          {/* Requesting permission spinner */}
          {recorder.permission === "requesting" && (
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10 animate-pulse-soft">
                <svg className="h-10 w-10 text-accent-primary animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">Requesting Access</h3>
              <p className="text-sm text-text-secondary">
                Please allow microphone access in the browser prompt...
              </p>
            </div>
          )}

          {/* Idle state — ready to record */}
          {recorder.permission === "granted" && isIdle && (
            <>
              {/* Timer ring */}
              <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
                <svg className="absolute h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="3" className="text-border-primary" />
                </svg>
                <div className="flex flex-col items-center">
                  <svg className="mb-2 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-xs text-text-muted">Ready</span>
                </div>
              </div>

              <Button onClick={handleStartRecording} size="lg" className="rounded-full px-8">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start Recording
              </Button>

              <p className="mt-4 text-center text-xs text-text-muted">
                Minimum 3 seconds. Maximum {formatDuration(recorder.maxDuration)}.
              </p>
            </>
          )}

          {/* Recording / Paused state */}
          {(isRecording || isPaused) && (
            <>
              {/* Timer ring with progress */}
              <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
                <svg className="absolute h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="3" className="text-border-primary" />
                  <circle
                    cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="3"
                    className={isPaused ? "text-warning" : "text-accent-primary"}
                    strokeDasharray={`${(progress / 100) * 452.389} 452.389`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.3s ease" }}
                  />
                </svg>
                <div className="flex flex-col items-center">
                  {/* Pulsing mic icon when recording */}
                  <div className={`mb-2 rounded-full p-2 ${isRecording ? "animate-recording-pulse" : ""}`}>
                    {isRecording ? (
                      <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      <svg className="h-8 w-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-3xl font-bold tabular-nums text-text-primary">
                    {formatDuration(recorder.duration)}
                  </span>
                  <span className={`text-xs font-medium ${isRecording ? "text-error" : "text-warning"}`}>
                    {isRecording ? "Recording" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Waveform */}
              <div className="mb-6 h-12 w-full max-w-md">
                <Waveform
                  data={recorder.waveform}
                  isRecording={isRecording}
                  barCount={64}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {recorder.isPauseSupported && (
                  <Button
                    onClick={isRecording ? recorder.pauseRecording : recorder.resumeRecording}
                    variant="secondary"
                    size="lg"
                    className="rounded-full"
                  >
                    {isRecording ? (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Resume
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={recorder.stopRecording} variant="danger" size="lg" className="rounded-full">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                  Stop
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-text-muted">
                {isRecording
                  ? "Recording in progress. Click stop when done."
                  : "Recording paused. Resume or stop."}
              </p>
            </>
          )}

          {/* Stopped — show preview */}
          {isStopped && recorder.recording && (
            <div className="w-full animate-fade-in-up">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Recording Complete</h3>
                <span className="text-xs text-text-muted">
                  {formatDuration(recorder.recording.duration)} &middot; {formatBytes(recorder.recording.blob.size)}
                </span>
              </div>

              {/* Waveform snapshot */}
              <div className="mb-4 rounded-xl bg-bg-tertiary p-4">
                <Waveform
                  data={recorder.waveform}
                  isRecording={false}
                  barCount={64}
                  className="h-10 mb-3"
                />
                <AudioPlayer src={recorder.recording.url} label="Your recording" compact showDownload />
              </div>

              {/* Save form */}
              <div className="space-y-3">
                <Input
                  label="Voice Name"
                  placeholder="e.g., My Professional Voice"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleSave} isLoading={isSaving} disabled={!voiceName.trim()}>
                  Save Voice Profile
                </Button>
                <Button onClick={handleRecordAgain} variant="secondary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Record Again
                </Button>
                <Button onClick={handleSaveAndRecordAnother} variant="outline" disabled={!voiceName.trim()}>
                  Save &amp; Record Another
                </Button>
                <Button onClick={handleDiscard} variant="ghost" className="text-error hover:text-error">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      {isIdle && recorder.permission === "granted" && (
        <Card variant="glass">
          <CardContent className="py-5">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Recording Tips</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Record in a quiet environment for best results
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Speak naturally at a normal pace and volume
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Record at least 10-30 seconds for a good voice sample
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Stay at a consistent distance from your microphone
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
