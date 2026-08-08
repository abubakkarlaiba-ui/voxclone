"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { cn, formatDuration } from "@/lib/utils";
import type { VoiceProfile, GeneratedAudio, GenerateOptions } from "@/types";

const TEXT_LIMITS = { min: 1, max: 5000 } as const;

function useWaveformBars(audioSrc: string | null) {
  const [bars, setBars] = useState<number[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(dataArray.length / 64));
      const result: number[] = [];
      for (let i = 0; i < 64; i++) {
        const idx = Math.min(i * step, dataArray.length - 1);
        result.push(dataArray[idx] ?? 0);
      }
      setBars(result);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      ctx.close();
      audio.pause();
      audio.src = "";
    };
  }, [audioSrc]);

  return bars;
}

function PlaybackWaveform({ bars, isPlaying }: { bars: number[]; isPlaying: boolean }) {
  const displayBars = useMemo(() => {
    if (bars.length > 0) return bars;
    return Array.from({ length: 64 }, (_, i) => {
      const t = i / 64;
      return Math.floor(40 + Math.sin(t * Math.PI * 2) * 30 + Math.sin(t * 7.3) * 10);
    });
  }, [bars]);

  return (
    <div className="flex items-end justify-center gap-[2px] h-16" aria-hidden="true">
      {displayBars.map((value, i) => {
        const normalized = isPlaying ? value / 255 : 0.15 + Math.sin(i * 0.3) * 0.05;
        const height = Math.max(2, normalized * 64);
        return (
          <div
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-[height] duration-75",
              isPlaying
                ? normalized > 0.6
                  ? "bg-accent-primary"
                  : normalized > 0.3
                    ? "bg-accent-primary/70"
                    : "bg-accent-primary/40"
                : "bg-border-secondary"
            )}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

function generateFilename(text: string) {
  const slug = text
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `voxclone-${slug || "speech"}-${Date.now()}`;
}

export default function TextToSpeechPage() {
  const router = useRouter();
  const { notifications, addNotification, removeNotification } = useNotification();

  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [options] = useState<GenerateOptions>({
    speed: 1,
    format: "mp3",
  });
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const waveformBars = useWaveformBars(generatedAudio?.audioUrl ?? null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/voices");
        const data = await res.json();
        if (!active) return;
        if (data.success) {
          const ready = data.data.filter((v: VoiceProfile) => v.status === "ready");
          setVoices(ready);
          if (ready.length > 0) setSelectedVoiceId(ready[0].id);
        } else {
          setError(data.error?.message || "Failed to load voices");
        }
      } catch {
        if (active) setError("Failed to load voices.");
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

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGeneratedAudio(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

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
      } else {
        addNotification("error", data.error?.message || "Generation failed");
      }
    } catch {
      addNotification("error", "Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, selectedVoiceId, text, options, addNotification]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleClearText = useCallback(() => {
    setText("");
    setGeneratedAudio(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => addNotification("error", "Failed to play audio"));
    }
  }, [addNotification]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const handleRestart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().catch(() => addNotification("error", "Failed to play audio"));
  }, [addNotification]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const vol = Number(e.target.value);
    audio.volume = vol;
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleDownload = useCallback(() => {
    if (!generatedAudio?.audioUrl) {
      addNotification("warning", "No audio to download.");
      return;
    }
    const a = document.createElement("a");
    a.href = generatedAudio.audioUrl;
    a.download = `${generateFilename(generatedAudio.text)}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addNotification("success", "Download started.");
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
          title="No authorized voices yet"
          description="Record and process a voice in the Studio to start generating speech."
          action={<Button onClick={() => router.push("/studio")}>Go to Studio</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      {generatedAudio?.audioUrl && (
        <audio
          ref={audioRef}
          src={generatedAudio.audioUrl}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            const audio = audioRef.current;
            if (audio) setCurrentTime(audio.currentTime);
          }}
          onLoadedMetadata={() => {
            const audio = audioRef.current;
            if (audio) {
              setDuration(audio.duration);
              audio.volume = volume;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

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

      {/* Step 3: Generation Progress */}
      {isGenerating && (
        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 animate-pulse-soft">
                <svg className="h-8 w-8 animate-spin text-accent-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-text-primary">Generating Speech</h3>
              <p className="text-sm text-text-secondary">
                Converting your text using <span className="font-medium text-text-primary">{selectedVoice?.name}</span>...
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI is processing your text...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Audio Result */}
      {generatedAudio && !isGenerating && (
        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">3</div>
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

            {/* Waveform visualization */}
            <PlaybackWaveform bars={waveformBars} isPlaying={isPlaying} />

            {/* Transport controls */}
            <div className="flex items-center gap-4">
              {/* Restart */}
              <button
                onClick={handleRestart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="Restart playback"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Play / Pause */}
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg shadow-accent-primary/25 transition-all hover:bg-accent-primary/90 hover:shadow-accent-primary/30"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Seek bar */}
              <div className="flex flex-1 items-center gap-2">
                <span className="w-10 text-right text-[11px] font-mono text-text-muted tabular-nums">
                  {formatDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
                  aria-label="Seek"
                />
                <span className="w-10 text-[11px] font-mono text-text-muted tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
                aria-label="Volume"
              />
              <span className="w-8 text-[11px] text-text-muted tabular-nums">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleRegenerate} variant="secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </Button>
              <Button onClick={handleDownload}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Audio
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
