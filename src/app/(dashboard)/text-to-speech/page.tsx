"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { PlaybackWaveform } from "@/components/voice/PlaybackWaveform";
import { cn } from "@/lib/utils";
import type { VoiceProfile, GeneratedAudio, GenerateOptions, ProviderCapabilities } from "@/types";

const TEXT_LIMITS = { min: 1, max: 5000 } as const;

function generateFilename(text: string) {
  const slug = text
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `voxclone-${slug || "speech"}-${Date.now()}`;
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  tooltip: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          {label}
          <span className="relative">
            <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg border border-border-primary bg-bg-elevated p-2.5 text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
              {tooltip}
            </span>
          </span>
        </label>
        <span className="text-[11px] font-mono text-text-muted tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
        aria-label={label}
      />
    </div>
  );
}

function ToggleControl({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  tooltip: string;
}) {
  return (
    <div className="group flex items-center justify-between">
      <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        {label}
        <span className="relative">
          <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg border border-border-primary bg-bg-elevated p-2.5 text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
            {tooltip}
          </span>
        </span>
      </label>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          value ? "bg-accent-primary" : "bg-border-primary"
        )}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            value ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  tooltip: string;
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
        {label}
        <span className="relative">
          <svg className="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-52 -translate-x-1/2 rounded-lg border border-border-primary bg-bg-elevated p-2.5 text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
            {tooltip}
          </span>
        </span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function TextToSpeechPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null);
  const [options, setOptions] = useState<GenerateOptions>({});
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [voicesRes, capsRes] = await Promise.all([
          fetch("/api/voices"),
          fetch("/api/capabilities"),
        ]);
        const [voicesData, capsData] = await Promise.all([
          voicesRes.json(),
          capsRes.json(),
        ]);
        if (!active) return;
        if (voicesData.success) {
          const ready = voicesData.data.filter((v: VoiceProfile) => v.status === "ready");
          setVoices(ready);
          if (ready.length > 0) setSelectedVoiceId(ready[0].id);
        } else {
          setError(voicesData.error?.message || "Failed to load voices");
        }
        if (capsData.success) {
          setCapabilities(capsData.data);
          const c = capsData.data.controls;
          setOptions({
            speed: c.speed.default,
            stability: c.stability.default,
            similarityBoost: c.similarityBoost.default,
            style: c.style.default,
            useSpeakerBoost: c.speakerBoost.default,
            language: c.languages[0]?.code,
            format: "mp3",
          });
        }
      } catch {
        if (active) setError("Failed to load data.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);

  const textError = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length < TEXT_LIMITS.min) return `Text must be at least ${TEXT_LIMITS.min} character`;
    if (trimmed.length > TEXT_LIMITS.max) return `Text exceeds ${TEXT_LIMITS.max} character limit`;
    return null;
  }, [text]);

  const canGenerate = text.trim().length >= TEXT_LIMITS.min && text.trim().length <= TEXT_LIMITS.max && !textError && !!selectedVoiceId && !isGenerating;

  const handleOptionChange = useCallback((key: keyof GenerateOptions, value: unknown) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          text: text.trim(),
          options,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedAudio(data.data);
        addNotification("success", "Speech generated successfully!");

        const voiceName = voices.find((v) => v.id === selectedVoiceId)?.name || "Unknown Voice";
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voiceId: selectedVoiceId,
            voiceName,
            text: data.data.text,
            audioUrl: data.data.audioUrl,
            duration: data.data.duration,
            format: options.format || "mp3",
            options,
          }),
        }).catch(() => {});
      } else {
        addNotification("error", data.error?.message || "Generation failed");
      }
    } catch {
      addNotification("error", "Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, selectedVoiceId, text, options, addNotification, voices]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleClearText = useCallback(() => {
    setText("");
    setGeneratedAudio(null);
  }, []);

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
          title="No authorized voices yet"
          description="Record and process a voice in the Studio to start generating speech."
          action={<Button onClick={() => router.push("/studio")}>Go to Studio</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Text to Speech</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Convert your text into natural-sounding speech using your authorized AI voice.
        </p>
      </div>

      {/* Step 1: Voice Selection */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary">1</div>
            <div>
              <CardTitle>Select Voice</CardTitle>
              <CardDescription>Choose your authorized personal AI voice clone.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoiceId(voice.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  selectedVoiceId === voice.id
                    ? "border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary/20"
                    : "border-border-primary bg-bg-tertiary hover:border-border-secondary"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                  selectedVoiceId === voice.id
                    ? "bg-accent-primary/20 text-accent-primary"
                    : "bg-bg-elevated text-text-muted"
                )}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{voice.name}</p>
                  {voice.description && (
                    <p className="mt-0.5 truncate text-xs text-text-muted">{voice.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-success">
                      <span className="h-1 w-1 rounded-full bg-success" />
                      Authorized
                    </span>
                    <span>{voice.samples.length} samples</span>
                  </div>
                </div>
                {selectedVoiceId === voice.id && (
                  <svg className="h-5 w-5 flex-shrink-0 text-accent-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Text Input */}
      <Card variant="glass" className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary">2</div>
            <div>
              <CardTitle>Enter Text</CardTitle>
              <CardDescription>Type or paste the text you want to convert to speech.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className={cn(
                "text-base leading-relaxed",
                textError && "border-error/50"
              )}
            />
            <div className="flex items-center justify-between mt-2">
              <div>
                {textError && (
                  <p className="text-xs text-error">{textError}</p>
                )}
                {selectedVoice && (
                  <p className="text-xs text-text-muted">
                    Voice: <span className="font-medium text-text-secondary">{selectedVoice.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-xs tabular-nums",
                  text.length > TEXT_LIMITS.max ? "text-error" : text.length > TEXT_LIMITS.max * 0.9 ? "text-warning" : "text-text-muted"
                )}>
                  {text.length.toLocaleString()} / {TEXT_LIMITS.max.toLocaleString()}
                </span>
                {text.length > 0 && (
                  <button
                    onClick={handleClearText}
                    className="text-xs text-text-muted transition-colors hover:text-error"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            isLoading={isGenerating}
            fullWidth
            size="lg"
            className="text-base"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Speech...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Generate Speech
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Voice Controls */}
      {capabilities && (
        <Card variant="glass" className="mb-6">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-xs font-bold text-accent-primary">3</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Voice Controls</p>
                <p className="text-xs text-text-muted">
                  Adjust speed, stability, similarity, and output format.
                  {capabilities.provider !== "mock" && (
                    <span className="ml-1 text-accent-primary">Powered by {capabilities.provider}</span>
                  )}
                </p>
              </div>
            </div>
            <svg
              className={cn(
                "h-5 w-5 text-text-muted transition-transform",
                showControls && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showControls && (
            <CardContent className="border-t border-border-primary pt-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <SliderControl
                  label="Speed"
                  value={options.speed ?? capabilities.controls.speed.default}
                  onChange={(v) => handleOptionChange("speed", v)}
                  min={capabilities.controls.speed.min}
                  max={capabilities.controls.speed.max}
                  step={capabilities.controls.speed.step}
                  tooltip={capabilities.controls.speed.tooltip}
                />
                <SliderControl
                  label="Stability"
                  value={options.stability ?? capabilities.controls.stability.default}
                  onChange={(v) => handleOptionChange("stability", v)}
                  min={capabilities.controls.stability.min}
                  max={capabilities.controls.stability.max}
                  step={capabilities.controls.stability.step}
                  tooltip={capabilities.controls.stability.tooltip}
                />
                <SliderControl
                  label="Similarity"
                  value={options.similarityBoost ?? capabilities.controls.similarityBoost.default}
                  onChange={(v) => handleOptionChange("similarityBoost", v)}
                  min={capabilities.controls.similarityBoost.min}
                  max={capabilities.controls.similarityBoost.max}
                  step={capabilities.controls.similarityBoost.step}
                  tooltip={capabilities.controls.similarityBoost.tooltip}
                />
                <SliderControl
                  label="Style"
                  value={options.style ?? capabilities.controls.style.default}
                  onChange={(v) => handleOptionChange("style", v)}
                  min={capabilities.controls.style.min}
                  max={capabilities.controls.style.max}
                  step={capabilities.controls.style.step}
                  tooltip={capabilities.controls.style.tooltip}
                />

                <ToggleControl
                  label="Speaker Boost"
                  value={options.useSpeakerBoost ?? capabilities.controls.speakerBoost.default}
                  onChange={(v) => handleOptionChange("useSpeakerBoost", v)}
                  tooltip={capabilities.controls.speakerBoost.tooltip}
                />

                {capabilities.controls.languages.length > 1 && (
                  <SelectControl
                    label="Language"
                    value={options.language ?? capabilities.controls.languages[0].code}
                    onChange={(v) => handleOptionChange("language", v)}
                    options={capabilities.controls.languages.map((l) => ({ value: l.code, label: l.name }))}
                    tooltip="Select the output language for multilingual speech generation."
                  />
                )}

                <SelectControl
                  label="Output Format"
                  value={options.format ?? "mp3"}
                  onChange={(v) => handleOptionChange("format", v as GenerateOptions["format"])}
                  options={capabilities.controls.formats}
                  tooltip="MP3 is smallest and most compatible. WAV is lossless but larger."
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 4: Generation Progress */}
      {isGenerating && (
        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <div className="progress-bar">
            <div className="h-full rounded-full" />
          </div>
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 animate-pulse-soft">
                <svg className="h-8 w-8 animate-spin text-accent-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-text-primary">Generating Speech</h3>
              <p className="text-sm text-text-secondary">
                Converting your text using <span className="font-medium text-text-primary">{selectedVoice?.name}</span>...
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                <div className="processing-dots">
                  <span /><span /><span />
                </div>
                AI is processing your text
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Audio Result */}
      {generatedAudio && !isGenerating && (
        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">4</div>
                <div>
                  <CardTitle>Generated Audio</CardTitle>
                  <CardDescription>Play, adjust, and download your generated speech.</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Quoted text */}
            <div className="rounded-xl bg-bg-tertiary/50 px-4 py-3">
              <p className="text-sm italic text-text-secondary line-clamp-3">&quot;{generatedAudio.text}&quot;</p>
            </div>

            {/* Self-contained waveform player */}
            <PlaybackWaveform
              src={generatedAudio.audioUrl}
              filename={`${generateFilename(generatedAudio.text)}.mp3`}
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleRegenerate} variant="secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </Button>
              <Button onClick={handleClearText} variant="ghost" className="text-text-muted">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
