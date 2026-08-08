"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn, formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  label?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

export function AudioPlayer({
  src,
  label,
  onPlay,
  onPause,
  onEnded,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Failed to play audio"));
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlayHandler = () => { setIsPlaying(true); onPlay?.(); };
    const onPauseHandler = () => { setIsPlaying(false); onPause?.(); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEndHandler = () => { setIsPlaying(false); setCurrentTime(0); onEnded?.(); };
    const onErrorHandler = () => setError("Failed to load audio");

    audio.addEventListener("play", onPlayHandler);
    audio.addEventListener("pause", onPauseHandler);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEndHandler);
    audio.addEventListener("error", onErrorHandler);

    return () => {
      audio.removeEventListener("play", onPlayHandler);
      audio.removeEventListener("pause", onPauseHandler);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEndHandler);
      audio.removeEventListener("error", onErrorHandler);
    };
  }, [onPlay, onPause, onEnded]);

  if (error) {
    return (
      <div className={cn("rounded-lg border border-error/20 bg-error/5 p-3 text-xs text-error", className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary transition-all hover:bg-accent-primary/20"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5">
        {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
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
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
            aria-label="Seek"
          />
          <span className="w-10 text-right text-[11px] font-mono text-text-muted tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
