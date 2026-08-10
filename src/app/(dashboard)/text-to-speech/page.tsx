"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { cn, formatDuration } from "@/lib/utils";
import { getLanguageFlag, getInitials } from "@/lib/flags";
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

/* ─── Voice Pill Tab ─── */
function VoicePill({
  voice,
  isSelected,
  flag,
  onSelect,
  onPreview,
  isPreviewPlaying,
}: {
  voice: VoiceProfile;
  isSelected: boolean;
  flag: string;
  onSelect: () => void;
  onPreview: (url: string) => void;
  isPreviewPlaying: boolean;
}) {
  const initials = getInitials(voice.name);
  const sampleUrl = voice.samples?.[0]?.url;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2.5 rounded-full border px-3 py-2 transition-all duration-200 flex-shrink-0",
        isSelected
          ? "border-accent-primary/40 bg-accent-primary/10 shadow-[0_0_16px_rgba(99,102,241,0.15)]"
          : "border-border-primary/60 bg-bg-secondary/50 hover:border-border-secondary hover:bg-bg-tertiary/50"
      )}
    >
      <div className="relative flex-shrink-0">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
          isSelected
            ? "bg-accent-primary/20 text-accent-primary"
            : "bg-bg-elevated text-text-muted"
        )}>
          {initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">{flag}</span>
      </div>

      <div className="text-left min-w-0">
        <p className={cn(
          "text-sm font-medium truncate max-w-[120px]",
          isSelected ? "text-text-primary" : "text-text-secondary"
        )}>
          {voice.name}
        </p>
        <p className="text-[10px] text-text-muted">
          {voice.samples.length} sample{voice.samples.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isSelected && (
        <svg className="h-4 w-4 flex-shrink-0 text-accent-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}

      {sampleUrl && (
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(sampleUrl); }}
          className={cn(
            "ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all",
            isPreviewPlaying
              ? "bg-accent-primary text-white"
              : "bg-bg-elevated text-text-muted hover:bg-accent-primary/20 hover:text-accent-primary"
          )}
          aria-label={`Preview ${voice.name}`}
        >
          {isPreviewPlaying ? (
            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-2.5 w-2.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </button>
  );
}

/* ─── Bottom Sticky Audio Bar ─── */
function StickyAudioBar({
  audio,
  isGenerating,
  onRegenerate,
  speed,
  onSpeedChange,
}: {
  audio: GeneratedAudio | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!audio) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setBars([]);
    }
  }, [audio]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => {
      const d = el.duration;
      setDuration(Number.isFinite(d) && d > 0 ? d : 0);
    };
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0); };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, [audio]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) el.pause();
    else el.play().catch(() => {});
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const t = Number(e.target.value);
    el.currentTime = t;
    setCurrentTime(t);
  }, []);

  const handleDownload = useCallback(() => {
    if (!audio) return;
    const a = document.createElement("a");
    a.href = audio.audioUrl;
    a.download = generateFilename(audio.text);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audio]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    onSpeedChange(speeds[(idx + 1) % speeds.length]);
  }, [speed, onSpeedChange]);

  const staticBars = useMemo(
    () => Array.from({ length: 24 }, (_, i) => 30 + Math.sin(i * 0.8) * 20 + Math.cos(i * 1.3) * 10),
    []
  );

  const displayBars = isPlaying ? bars : staticBars;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500",
      audio ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
    )}>
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="eleven-card eleven-glow-bg flex items-center gap-4 px-5 py-3">
          <audio ref={audioRef} src={audio?.audioUrl} preload="metadata" />

          {/* Mini waveform bars */}
          <div className="hidden sm:flex items-end gap-[2px] h-8" aria-hidden="true">
            {displayBars.map((v, i) => {
              const norm = isPlaying ? v / 255 : 0.3 + Math.sin(i * 0.4) * 0.1;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-[height] duration-75",
                    isPlaying && norm > 0.5 ? "bg-accent-primary" : "bg-accent-primary/40"
                  )}
                  style={{ height: `${Math.max(2, norm * 32)}px` }}
                />
              );
            })}
          </div>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg shadow-accent-primary/25 transition-all hover:bg-accent-primary/90 hover:shadow-accent-primary/30"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Seek + times */}
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="w-10 text-[10px] font-mono text-text-muted tabular-nums flex-shrink-0">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary min-w-0"
              aria-label="Seek"
            />
            <span className="w-10 text-right text-[10px] font-mono text-text-muted tabular-nums flex-shrink-0">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Text preview */}
          <p className="hidden md:block text-xs text-text-muted truncate max-w-[180px]">
            {audio?.text}
          </p>

          {/* Speed pill */}
          <button
            onClick={cycleSpeed}
            className="pill-badge pill-badge-accent flex-shrink-0 tabular-nums"
            title="Playback speed"
          >
            {speed}x
          </button>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:opacity-40"
            aria-label="Regenerate"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Download"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
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
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
          const ready = voicesData.data.filter((v: VoiceProfile) => v.status === "ready" || (v.samples && v.samples.length > 0));
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
        body: JSON.stringify({ voiceId: selectedVoiceId, text: text.trim(), options }),
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
            voiceId: selectedVoiceId, voiceName,
            text: data.data.text, audioUrl: data.data.audioUrl,
            duration: data.data.duration, format: options.format || "mp3", options,
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

  const handleClearText = useCallback(() => { setText(""); setGeneratedAudio(null); }, []);

  const insertPause = useCallback(() => {
    const ta = document.querySelector<HTMLTextAreaElement>("[data-textarea]");
    if (!ta) { setText((p) => p + " ... "); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);
    setText(before + " ... " + after);
  }, [text]);

  const handlePreviewVoice = useCallback((sampleUrl: string) => {
    const audio = new Audio(sampleUrl);
    audio.play().catch(() => {});
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
    <div className={cn("mx-auto max-w-4xl py-8 pb-32", generatedAudio && "pb-40")}>
      {/* ─── Top Voice Selection Bar ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Select Voice</h2>
          {capabilities && capabilities.controls.languages.length > 1 && (
            <select
              value={options.language ?? ""}
              onChange={(e) => handleOptionChange("language", e.target.value)}
              className="rounded-lg border border-border-primary/60 bg-bg-secondary/50 px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none"
            >
              {capabilities.controls.languages.map((l) => (
                <option key={l.code} value={l.code}>{getLanguageFlag(l.code)} {l.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {voices.map((voice) => (
            <VoicePill
              key={voice.id}
              voice={voice}
              isSelected={selectedVoiceId === voice.id}
              flag={getLanguageFlag(options?.language)}
              onSelect={() => setSelectedVoiceId(voice.id)}
              onPreview={handlePreviewVoice}
              isPreviewPlaying={previewVoiceId === voice.id}
            />
          ))}
        </div>
      </div>

      {/* ─── Text Generation Box ─── */}
      <div className="eleven-card mb-6 overflow-hidden">
        {/* Textarea — borderless */}
        <textarea
          data-textarea
          placeholder="Type or paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className={cn(
            "w-full resize-none border-0 bg-transparent px-6 pt-6 pb-2 text-[15px] leading-relaxed text-text-primary placeholder-text-muted focus:outline-none",
            textError && "placeholder:text-error/40"
          )}
        />

        {/* Bottom bar inside card */}
        <div className="flex items-center justify-between border-t border-border-primary/40 px-5 py-2.5">
          <div className="flex items-center gap-3">
            {/* Pause insertion button */}
            <button
              onClick={insertPause}
              className="pill-badge hover:bg-bg-elevated"
              title="Insert pause marker"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </button>

            {selectedVoice && (
              <span className="text-[11px] text-text-muted">
                {selectedVoice.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {textError && (
              <span className="text-[11px] text-error">{textError}</span>
            )}
            <span className={cn(
              "text-[11px] tabular-nums",
              text.length > TEXT_LIMITS.max ? "text-error" : text.length > TEXT_LIMITS.max * 0.9 ? "text-warning" : "text-text-muted"
            )}>
              {text.length.toLocaleString()} / {TEXT_LIMITS.max.toLocaleString()}
            </span>
            {text.length > 0 && (
              <button
                onClick={handleClearText}
                className="text-[11px] text-text-muted transition-colors hover:text-error"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Generate Button ─── */}
      <div className="relative mb-6 group eleven-glow-bg">
        <div className={cn(
          "absolute -inset-1 rounded-2xl transition-opacity duration-500",
          canGenerate
            ? "bg-gradient-to-r from-accent-primary/20 via-accent-secondary/20 to-accent-primary/20 opacity-100 blur-lg animate-glow-pulse"
            : "opacity-0"
        )} />
        {canGenerate && !isGenerating && (
          <svg className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] animate-spin-slow" viewBox="0 0 200 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="30%" stopColor="rgba(99,102,241,0.4)" />
                <stop offset="50%" stopColor="rgba(139,92,246,0.6)" />
                <stop offset="70%" stopColor="rgba(99,102,241,0.4)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="200" height="50" rx="25" fill="none" stroke="url(#glow-grad)" strokeWidth="1.5" />
          </svg>
        )}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={cn(
            "btn-generate relative w-full text-base font-semibold flex items-center justify-center gap-2",
            !canGenerate && "opacity-40 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Speech...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Generate Speech
            </>
          )}
        </button>
      </div>

      {/* ─── Voice Controls ─── */}
      {capabilities && (
        <div className="eleven-card mb-6 overflow-hidden">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-sm font-medium text-text-secondary">Voice Controls</span>
              {capabilities.provider !== "mock" && (
                <span className="pill-badge pill-badge-accent text-[10px]">{capabilities.provider}</span>
              )}
            </div>
            <svg
              className={cn("h-4 w-4 text-text-muted transition-transform", showControls && "rotate-180")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showControls && (
            <div className="border-t border-border-primary/40 px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {(["speed", "stability", "similarityBoost", "style"] as const).map((key) => {
                  const ctrl = capabilities.controls[key === "similarityBoost" ? "similarityBoost" : key];
                  if (!ctrl) return null;
                  const label = key === "similarityBoost" ? "Similarity" : key.charAt(0).toUpperCase() + key.slice(1);
                  const val = options[key] ?? ctrl.default;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-text-secondary">{label}</label>
                        <span className="text-[10px] font-mono text-text-muted tabular-nums">{Number(val).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={Number(val)}
                        onChange={(e) => handleOptionChange(key, Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
                        aria-label={label}
                      />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">Speaker Boost</label>
                  <button
                    onClick={() => handleOptionChange("useSpeakerBoost", !options.useSpeakerBoost)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      options.useSpeakerBoost ? "bg-accent-primary" : "bg-border-primary"
                    )}
                    role="switch"
                    aria-checked={!!options.useSpeakerBoost}
                  >
                    <span className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      options.useSpeakerBoost ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Output Format</label>
                  <select
                    value={options.format ?? "mp3"}
                    onChange={(e) => handleOptionChange("format", e.target.value)}
                    className="w-full rounded-lg border border-border-primary/60 bg-bg-secondary/50 px-3 py-1.5 text-xs text-text-primary transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none"
                  >
                    {capabilities.controls.formats.map((f: { value: string; label: string }) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Generating Progress ─── */}
      {isGenerating && (
        <div className="eleven-card mb-6 animate-fade-in-up">
          <div className="flex flex-col items-center py-12 text-center">
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
          </div>
        </div>
      )}

      {/* ─── Inline result preview (above sticky bar) ─── */}
      {generatedAudio && !isGenerating && (
        <div className="eleven-card eleven-glow-bg mb-6 animate-fade-in-up p-5">
          <p className="text-xs text-text-muted mb-3">Generated with {selectedVoice?.name}</p>
          <p className="text-sm italic text-text-secondary line-clamp-2 mb-3">&quot;{generatedAudio.text}&quot;</p>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerate} variant="secondary" size="sm">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </Button>
          </div>
        </div>
      )}

      {/* ─── Bottom Sticky Audio Bar ─── */}
      <StickyAudioBar
        audio={generatedAudio}
        isGenerating={isGenerating}
        onRegenerate={handleGenerate}
        speed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
      />

      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </div>
  );
}
