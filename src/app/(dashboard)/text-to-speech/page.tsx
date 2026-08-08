"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/constants";
import type { VoiceProfile, GeneratedAudio, GenerateOptions } from "@/types";

export default function TextToSpeechPage() {
  const router = useRouter();
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<GenerateOptions>({ speed: 1, pitch: 1, format: "mp3" });
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifications, addNotification, removeNotification } = useNotification();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/voices");
        const data = await res.json();
        if (!cancelled) {
          if (data.success) {
            setVoices(data.data);
            if (data.data.length > 0) setSelectedVoiceId(data.data[0].id);
          } else {
            setError(data.error?.message || "Failed to load voices");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load voices.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);
  const isValid = text.length >= MIN_TEXT_LENGTH && text.length <= MAX_TEXT_LENGTH;

  const handleGenerate = useCallback(async () => {
    if (!selectedVoiceId || !isValid) return;
    setIsGenerating(true);
    setGeneratedAudio(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId: selectedVoiceId, text: text.trim(), options }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedAudio(data.data);
        addNotification("success", "Speech generated successfully!");
      } else {
        addNotification("error", data.error?.message || "Generation failed");
      }
    } catch {
      addNotification("error", "Failed to generate speech.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedVoiceId, text, options, isValid, addNotification]);

  const handleDownload = useCallback(() => {
    if (!generatedAudio?.audioUrl) {
      addNotification("warning", "No audio to download. Configure your API key first.");
      return;
    }
    const a = document.createElement("a");
    a.href = generatedAudio.audioUrl;
    a.download = `voxclone-${generatedAudio.id}.mp3`;
    a.click();
  }, [generatedAudio, addNotification]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <LoadingSpinner label="Loading voices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (voices.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
          title="No voice profiles yet"
          description="Create a voice profile first to start generating speech."
          action={<Button onClick={() => router.push("/studio")}>Create Voice</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Text to Speech</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Convert your text into natural-sounding speech using your AI voice.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Input */}
        <div className="lg:col-span-2">
          <Card variant="glass">
            <CardHeader>
              <div>
                <CardTitle>Text Input</CardTitle>
                <CardDescription>Enter the text you want to convert to speech.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                maxLength={MAX_TEXT_LENGTH}
                error={text.length > MAX_TEXT_LENGTH ? `Max ${MAX_TEXT_LENGTH} characters` : undefined}
                helperText={`${text.length}/${MAX_TEXT_LENGTH} characters`}
              />
              <Button
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={!isValid || isGenerating}
                fullWidth
                size="lg"
              >
                {isGenerating ? "Generating..." : "Generate Speech"}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {generatedAudio && !isGenerating && (
            <Card variant="glass" className="mt-6 animate-fade-in-up">
              <CardHeader>
                <div>
                  <CardTitle>Generated Audio</CardTitle>
                  <CardDescription>Preview and download your generated speech.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-bg-tertiary p-4">
                  <p className="mb-3 text-sm italic text-text-secondary">&quot;{generatedAudio.text}&quot;</p>
                  {generatedAudio.audioUrl ? (
                    <AudioPlayer src={generatedAudio.audioUrl} label="Generated speech" />
                  ) : (
                    <p className="text-center text-xs text-text-muted py-2">
                      Audio will appear here once the API is configured.
                    </p>
                  )}
                </div>
                <Button onClick={handleDownload} variant="secondary" fullWidth>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Audio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {selectedVoice && (
                <p className="mt-2 text-xs text-text-muted">{selectedVoice.description || "No description"}</p>
              )}
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Speed: {options.speed}x
                </label>
                <input
                  type="range" min={0.5} max={2} step={0.1}
                  value={options.speed}
                  onChange={(e) => setOptions((p) => ({ ...p, speed: Number(e.target.value) }))}
                  className="w-full accent-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Format</label>
                <select
                  value={options.format}
                  onChange={(e) => setOptions((p) => ({ ...p, format: e.target.value as GenerateOptions["format"] }))}
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                  <option value="ogg">OGG</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card variant="glass" className="p-8">
            <LoadingSpinner label="Generating speech..." />
          </Card>
        </div>
      )}

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}