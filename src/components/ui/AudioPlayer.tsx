"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn, formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  label?: string;
  showVolume?: boolean;
  showDownload?: boolean;
  showReplay?: boolean;
  downloadFilename?: string;
  compact?: boolean;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

function VolumeIcon({ level }: { level: number }) {
  if (level === 0) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  if (level < 0.5) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export function AudioPlayer({
  src,
  label,
  showVolume = true,
  showDownload = false,
  showReplay = false,
  downloadFilename,
  compact = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveVolume = isMuted ? 0 : volume;

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Failed to play audio"));
    }
  }, [isPlaying]);

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().catch(() => setError("Failed to play audio"));
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    setIsMuted(next);
    audio.volume = next ? 0 : volume;
  }, [isMuted, volume]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = src;
    a.download = downloadFilename || "audio";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [src, downloadFilename]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const onPlayHandler = () => { setIsPlaying(true); onPlay?.(); };
    const onPauseHandler = () => { setIsPlaying(false); onPause?.(); };
    const onTimeUpdateHandler = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const onLoadedMeta = () => {
      const d = audio.duration;
      setDuration(Number.isFinite(d) && d > 0 ? d : 0);
      setIsLoading(false);
    };
    const onEndHandler = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const onErrorHandler = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };
    const onLoadStart = () => { setIsLoading(true); setError(null); };

    audio.addEventListener("play", onPlayHandler);
    audio.addEventListener("pause", onPauseHandler);
    audio.addEventListener("timeupdate", onTimeUpdateHandler);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEndHandler);
    audio.addEventListener("error", onErrorHandler);
    audio.addEventListener("loadstart", onLoadStart);

    return () => {
      audio.removeEventListener("play", onPlayHandler);
      audio.removeEventListener("pause", onPauseHandler);
      audio.removeEventListener("timeupdate", onTimeUpdateHandler);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEndHandler);
      audio.removeEventListener("error", onErrorHandler);
      audio.removeEventListener("loadstart", onLoadStart);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, volume]);

  if (error) {
    return (
      <div className={cn("rounded-lg border border-error/20 bg-error/5 p-3 text-xs text-error", className)}>
        {error}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary transition-all hover:bg-accent-primary/20"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          <span className="w-9 text-[10px] font-mono text-text-muted tabular-nums">
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
          <span className="w-9 text-right text-[10px] font-mono text-text-muted tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {label && (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="w-10 text-[11px] font-mono text-text-muted tabular-nums">
          {formatDuration(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
          aria-label="Seek"
        />
        <span className="w-10 text-right text-[11px] font-mono text-text-muted tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Transport + volume row */}
      <div className="flex items-center gap-2">
        {/* Replay */}
        {showReplay && (
          <button
            onClick={handleReplay}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Replay"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary text-white shadow-lg shadow-accent-primary/25 transition-all hover:bg-accent-primary/90 hover:shadow-accent-primary/30"
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

        {/* Volume */}
        {showVolume && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <VolumeIcon level={effectiveVolume} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={effectiveVolume}
              onChange={handleVolumeChange}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
              aria-label="Volume"
            />
            <span className="w-8 text-[11px] text-text-muted tabular-nums">
              {Math.round(effectiveVolume * 100)}%
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Download */}
        {showDownload && (
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Download"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
