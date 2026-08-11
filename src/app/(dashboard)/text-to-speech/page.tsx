"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNotification } from "@/hooks";
import { NotificationContainer } from "@/components/ui/Notification";
import { cn, formatDuration } from "@/lib/utils";

/* ─── Constants ─── */
const TEXT_LIMITS = { min: 1, max: 5000 } as const;
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

interface KokoroVoice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: "male" | "female" | "neutral";
  description: string;
}

function generateFilename(text: string) {
  const slug = text
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `kokoro-generated-voice-${slug || "speech"}-${Date.now()}`;
}

const LANG_FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  ja: "\u{1F1EF}\u{1F1F5}",
  zh: "\u{1F1E8}\u{1F1F3}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
  hi: "\u{1F1EE}\u{1F1F3}",
  it: "\u{1F1EE}\u{1F1F9}",
  pt: "\u{1F1F5}\u{1F1F9}",
  ko: "\u{1F1F0}\u{1F1F7}",
};

const GENDER_ICONS: Record<string, string> = {
  male: "\u2642",
  female: "\u2640",
  neutral: "\u2022",
};

/* ─── Voice Pill Tab ─── */
function VoicePill({
  voice,
  isSelected,
  onSelect,
}: {
  voice: KokoroVoice;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const flag = LANG_FLAGS[voice.languageCode] || "\u{1F310}";
  const genderIcon = GENDER_ICONS[voice.gender] || "";

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
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
            isSelected
              ? "bg-accent-primary/20 text-accent-primary"
              : "bg-bg-elevated text-text-muted"
          )}
        >
          {voice.name.charAt(0)}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
          {flag}
        </span>
      </div>

      <div className="text-left min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate max-w-[120px]",
            isSelected ? "text-text-primary" : "text-text-secondary"
          )}
        >
          {voice.name}
        </p>
        <p className="text-[10px] text-text-muted">
          {voice.language} {genderIcon}
        </p>
      </div>

      {isSelected && (
        <svg
          className="h-4 w-4 flex-shrink-0 text-accent-primary"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </button>
  );
}

/* ─── Speed Selector ─── */
function SpeedSelector({
  speed,
  onSpeedChange,
}: {
  speed: number;
  onSpeedChange: (s: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {SPEED_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSpeedChange(s)}
          className={cn(
            "pill-badge tabular-nums transition-all",
            speed === s
              ? "pill-badge-accent"
              : "hover:bg-bg-elevated"
          )}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

/* ─── Bottom Sticky Audio Bar ─── */
function StickyAudioBar({
  audioUrl,
  audioBlob,
  text,
  isGenerating,
  onRegenerate,
  speed,
  onSpeedChange,
  fileName,
}: {
  audioUrl: string | null;
  audioBlob: Blob | null;
  text: string;
  isGenerating: boolean;
  onRegenerate: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  fileName: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

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
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

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
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) el.pause();
    else el.play().catch(() => {});
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = audioRef.current;
      if (!el) return;
      const t = Number(e.target.value);
      el.currentTime = t;
      setCurrentTime(t);
    },
    []
  );

  const handleDownload = useCallback(() => {
    if (!audioUrl || !audioBlob) return;
    const ext = audioBlob.type.includes("wav") ? "wav" : "mp3";
    const name = fileName || `kokoro-generated-voice.${ext}`;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioUrl, audioBlob, fileName]);

  const cycleSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed as (typeof SPEED_OPTIONS)[number]);
    onSpeedChange(SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]);
  }, [speed, onSpeedChange]);

  const staticBars = useMemo(
    () =>
      Array.from(
        { length: 24 },
        (_, i) => 30 + Math.sin(i * 0.8) * 20 + Math.cos(i * 1.3) * 10
      ),
    []
  );

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500",
        audioUrl
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="eleven-card eleven-glow-bg flex items-center gap-4 px-5 py-3">
          <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />

          {/* Mini waveform bars */}
          <div
            className="hidden sm:flex items-end gap-[2px] h-8"
            aria-hidden="true"
          >
            {staticBars.map((v, i) => {
              const norm = isPlaying
                ? 0.3 + Math.sin(Date.now() * 0.01 + i * 0.8) * 0.3
                : 0.3 + Math.sin(i * 0.4) * 0.1;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-[height] duration-75",
                    isPlaying && norm > 0.5
                      ? "bg-accent-primary"
                      : "bg-accent-primary/40"
                  )}
                  style={{
                    height: `${Math.max(2, norm * 32)}px`,
                  }}
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
              <svg
                className="ml-0.5 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
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
            {text}
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
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Download"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TextToSpeechPage() {
  const { notifications, addNotification, removeNotification } =
    useNotification();

  const [voices, setVoices] = useState<KokoroVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null
  );
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [ttsEngine, setTtsEngine] = useState<"kokoro" | "browser" | null>(null);
  const [isBrowserPlaying, setIsBrowserPlaying] = useState(false);

  const objectUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check Kokoro availability on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "ping", voice: "af_heart", speed: 1.0, format: "mp3" }),
          signal: AbortSignal.timeout(5000),
        });
        if (!active) return;
        setTtsEngine(res.status === 502 || res.status === 503 || res.status === 504 || !res.ok ? "browser" : "kokoro");
      } catch {
        if (active) setTtsEngine("browser");
      }
    })();
    return () => { active = false; };
  }, []);

  // Load voices from static data
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const mod = await import("@/lib/kokoro/voices");
        if (!active) return;
        setVoices(mod.KOKORO_VOICES);
        if (mod.KOKORO_VOICES.length > 0) {
          setSelectedVoiceId(mod.KOKORO_VOICES[0].id);
        }
      } catch {
        if (active) setError("Failed to load voices.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const selectedVoice = useMemo(
    () => voices.find((v) => v.id === selectedVoiceId),
    [voices, selectedVoiceId]
  );

  const languages = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of voices) {
      if (!map.has(v.languageCode)) map.set(v.languageCode, v.language);
    }
    return Array.from(map.entries()).map(([code, name]) => ({
      code,
      name,
      flag: LANG_FLAGS[code] || "\u{1F310}",
    }));
  }, [voices]);

  const filteredVoices = useMemo(() => {
    let list = voices;
    if (selectedLang) {
      list = list.filter((v) => v.languageCode === selectedLang);
    }
    if (voiceSearch.trim()) {
      const q = voiceSearch.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.language.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [voices, selectedLang, voiceSearch]);

  const textError = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length < TEXT_LIMITS.min)
      return `Text must be at least ${TEXT_LIMITS.min} character`;
    if (trimmed.length > TEXT_LIMITS.max)
      return `Text exceeds ${TEXT_LIMITS.max} character limit`;
    return null;
  }, [text]);

  const canGenerate =
    text.trim().length >= TEXT_LIMITS.min &&
    text.trim().length <= TEXT_LIMITS.max &&
    !textError &&
    !!selectedVoiceId &&
    !isGenerating;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setGeneratedAudioUrl(null);
    setGeneratedBlob(null);

    const voiceName =
      voices.find((v) => v.id === selectedVoiceId)?.name || "Unknown Voice";

    // Try Kokoro first
    if (ttsEngine === "kokoro" || ttsEngine === null) {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            voice: selectedVoiceId,
            speed,
            format: "mp3",
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setGeneratedAudioUrl(url);
          setGeneratedBlob(blob);
          setGeneratedText(text.trim());
          setTtsEngine("kokoro");
          addNotification("success", "Speech generated with Kokoro!");

          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              voiceId: selectedVoiceId,
              voiceName,
              text: text.trim(),
              audioUrl: "",
              duration: 0,
              format: "mp3",
              options: { speed },
            }),
          }).catch(() => {});
          setIsGenerating(false);
          return;
        }

        setTtsEngine("browser");
      } catch {
        setTtsEngine("browser");
      }
    }

    // Browser SpeechSynthesis fallback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = speed;
      utteranceRef.current = utterance;

      const voicesList = window.speechSynthesis.getVoices();
      const match =
        voicesList.find(
          (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")
        ) || voicesList.find((v) => v.lang.startsWith("en"));
      if (match) utterance.voice = match;

      setGeneratedText(text.trim());
      setIsBrowserPlaying(true);

      utterance.onend = () => {
        setIsBrowserPlaying(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsBrowserPlaying(false);
        utteranceRef.current = null;
        addNotification("error", "Browser TTS playback failed.");
      };

      addNotification("info", `Playing via browser TTS (${voiceName})`);

      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          voiceName,
          text: text.trim(),
          audioUrl: "",
          duration: 0,
          format: "mp3",
          options: { speed },
        }),
      }).catch(() => {});

      window.speechSynthesis.speak(utterance);
    } else {
      addNotification("error", "No TTS engine available.");
    }
    setIsGenerating(false);
  }, [canGenerate, selectedVoiceId, text, speed, addNotification, voices, ttsEngine]);

  const handleStopBrowserTts = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsBrowserPlaying(false);
    utteranceRef.current = null;
  }, []);

  const handleClearText = useCallback(() => {
    setText("");
    setGeneratedAudioUrl(null);
    setGeneratedBlob(null);
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
        <div className="eleven-card p-8 text-center">
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl py-8 pb-32",
        generatedAudioUrl && "pb-40"
      )}
    >
      {/* ─── Header ─── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Text to Speech</h1>
          <p className="text-sm text-[#8b8fa3]">
            Convert your text to natural speech
          </p>
        </div>
        {ttsEngine && (
          <div className={`pill-badge text-[10px] ${ttsEngine === "kokoro" ? "pill-badge-accent" : "bg-bg-elevated text-text-muted"}`}>
            {ttsEngine === "kokoro" ? "Kokoro TTS" : "Browser TTS"}
          </div>
        )}
      </div>

      {/* ─── Language Filter ─── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Language
          </h2>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedLang(null)}
            className={cn(
              "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              !selectedLang
                ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                : "border-border-primary/60 bg-bg-secondary/50 text-text-secondary hover:border-border-secondary"
            )}
          >
            All Languages
          </button>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() =>
                setSelectedLang(selectedLang === l.code ? null : l.code)
              }
              className={cn(
                "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                selectedLang === l.code
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary"
                  : "border-border-primary/60 bg-bg-secondary/50 text-text-secondary hover:border-border-secondary"
              )}
            >
              {l.flag} {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Voice Search ─── */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search voices..."
            value={voiceSearch}
            onChange={(e) => setVoiceSearch(e.target.value)}
            className="w-full rounded-lg border border-border-primary/60 bg-bg-secondary/50 pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted transition-colors hover:border-border-secondary focus:border-accent-primary focus:outline-none"
          />
        </div>
      </div>

      {/* ─── Voice Selection ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Select Voice
          </h2>
          <span className="text-[11px] text-text-muted">
            {filteredVoices.length} voice{filteredVoices.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {filteredVoices.map((voice) => (
            <VoicePill
              key={voice.id}
              voice={voice}
              isSelected={selectedVoiceId === voice.id}
              onSelect={() => setSelectedVoiceId(voice.id)}
            />
          ))}
          {filteredVoices.length === 0 && (
            <p className="text-sm text-text-muted py-4">
              No voices found matching your search.
            </p>
          )}
        </div>
      </div>

      {/* ─── Selected Voice Info ─── */}
      {selectedVoice && (
        <div className="eleven-card mb-6 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-sm font-bold">
              {selectedVoice.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {selectedVoice.name}
              </p>
              <p className="text-xs text-text-muted">
                {LANG_FLAGS[selectedVoice.languageCode] || ""}{" "}
                {selectedVoice.language} &middot;{" "}
                {GENDER_ICONS[selectedVoice.gender]}{" "}
                {selectedVoice.gender.charAt(0).toUpperCase() +
                  selectedVoice.gender.slice(1)}{" "}
                &middot; {selectedVoice.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Text Input ─── */}
      <div className="eleven-card mb-6 overflow-hidden">
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
        <div className="flex items-center justify-between border-t border-border-primary/40 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setText((p) => p + " ... ")}
              className="pill-badge hover:bg-bg-elevated"
              title="Insert pause marker"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pause
            </button>
          </div>
          <div className="flex items-center gap-3">
            {textError && (
              <span className="text-[11px] text-error">{textError}</span>
            )}
            <span
              className={cn(
                "text-[11px] tabular-nums",
                text.length > TEXT_LIMITS.max
                  ? "text-error"
                  : text.length > TEXT_LIMITS.max * 0.9
                    ? "text-warning"
                    : "text-text-muted"
              )}
            >
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

      {/* ─── Speed Control ─── */}
      <div className="eleven-card mb-6 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <svg
              className="h-4 w-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-sm font-medium text-text-secondary">
              Speed
            </span>
            <span className="pill-badge pill-badge-accent text-[10px] tabular-nums">
              {speed}x
            </span>
          </div>
        </div>
        <SpeedSelector speed={speed} onSpeedChange={setSpeed} />
      </div>

      {/* ─── Generate Button ─── */}
      <div className="relative mb-6 group eleven-glow-bg">
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl transition-opacity duration-500",
            canGenerate
              ? "bg-gradient-to-r from-accent-primary/20 via-accent-secondary/20 to-accent-primary/20 opacity-100 blur-lg animate-glow-pulse"
              : "opacity-0"
          )}
        />
        {canGenerate && !isGenerating && (
          <svg
            className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] animate-spin-slow"
            viewBox="0 0 200 50"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="glow-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop
                  offset="30%"
                  stopColor="rgba(99,102,241,0.4)"
                />
                <stop
                  offset="50%"
                  stopColor="rgba(139,92,246,0.6)"
                />
                <stop
                  offset="70%"
                  stopColor="rgba(99,102,241,0.4)"
                />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width="200"
              height="50"
              rx="25"
              fill="none"
              stroke="url(#glow-grad)"
              strokeWidth="1.5"
            />
          </svg>
        )}
        <button
          onClick={isBrowserPlaying ? handleStopBrowserTts : handleGenerate}
          disabled={!canGenerate && !isBrowserPlaying}
          className={cn(
            "btn-generate relative w-full text-base font-semibold flex items-center justify-center gap-2",
            !canGenerate && "opacity-40 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating voice...
            </>
          ) : isBrowserPlaying ? (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              Generate Speech
            </>
          )}
        </button>
      </div>

      {/* ─── Generating Progress ─── */}
      {isGenerating && (
        <div className="eleven-card mb-6 animate-fade-in-up">
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 animate-pulse-soft">
              <svg
                className="h-8 w-8 animate-spin text-accent-primary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-text-primary">
              Generating Speech
            </h3>
            <p className="text-sm text-text-secondary">
              Converting your text using{" "}
              <span className="font-medium text-text-primary">
                {selectedVoice?.name}
              </span>
              ...
            </p>
          </div>
        </div>
      )}

      {/* ─── Inline result preview ─── */}
      {(generatedAudioUrl || isBrowserPlaying) && !isGenerating && (
        <div className="eleven-card eleven-glow-bg mb-6 animate-fade-in-up p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-muted">
              {generatedAudioUrl
                ? `Generated with ${selectedVoice?.name} at ${speed}x speed`
                : `Playing via browser TTS (${selectedVoice?.name})`}
            </p>
            <span className={`pill-badge text-[10px] ${ttsEngine === "kokoro" ? "pill-badge-accent" : "bg-bg-elevated text-text-muted"}`}>
              {ttsEngine === "kokoro" ? "Kokoro TTS" : "Browser TTS"}
            </span>
          </div>
          <p className="text-sm italic text-text-secondary line-clamp-2 mb-3">
            &quot;{generatedText}&quot;
          </p>
          <div className="flex items-center gap-2">
            {generatedAudioUrl ? (
              <Button onClick={handleGenerate} variant="secondary" size="sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </Button>
            ) : isBrowserPlaying ? (
              <Button onClick={handleStopBrowserTts} variant="secondary" size="sm">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Stop
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Bottom Sticky Audio Bar ─── */}
      <StickyAudioBar
        audioUrl={generatedAudioUrl}
        audioBlob={generatedBlob}
        text={generatedText}
        isGenerating={isGenerating}
        onRegenerate={handleGenerate}
        speed={speed}
        onSpeedChange={setSpeed}
        fileName={
          generatedBlob
            ? generateFilename(generatedText)
            : "kokoro-generated-voice.mp3"
        }
      />

      <NotificationContainer
        notifications={notifications}
        onDismiss={removeNotification}
      />
    </div>
  );
}
