"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { cn, formatDuration } from "@/lib/utils";

interface PlaybackWaveformProps {
  src: string;
  filename?: string;
  className?: string;
  onEnded?: () => void;
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

export function PlaybackWaveform({
  src,
  filename,
  className,
  onEnded,
}: PlaybackWaveformProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [bars, setBars] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const effectiveVolume = isMuted ? 0 : volume;

  const staticBars = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const t = i / 64;
        return Math.floor(40 + Math.sin(t * Math.PI * 2) * 30 + Math.sin(t * 7.3) * 10);
      }),
    []
  );

  const displayBars = bars.length > 0 ? bars : staticBars;

  // AudioContext + AnalyserNode setup (runs once per src)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = volume;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Sync volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = effectiveVolume;
  }, [effectiveVolume]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const onErr = () => setError("Failed to load audio");

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, [onEnded]);

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
    if (audioRef.current) audioRef.current.volume = val;
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
    a.download = filename || "audio";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [src, filename]);

  if (error) {
    return (
      <div className={cn("rounded-lg border border-error/20 bg-error/5 p-3 text-xs text-error", className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <audio ref={audioRef} src={src} />

      {/* Waveform visualization */}
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

      {/* Seek bar */}
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

      {/* Transport + volume + download */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReplay}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Restart playback"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
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

        <div className="flex flex-1 items-center gap-2" />

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
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-border-primary accent-accent-primary"
            aria-label="Volume"
          />
          <span className="w-8 text-[11px] text-text-muted tabular-nums">
            {Math.round(effectiveVolume * 100)}%
          </span>
        </div>

        <button
          onClick={handleDownload}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Download"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
