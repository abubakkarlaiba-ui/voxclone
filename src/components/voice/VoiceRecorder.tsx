"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn, formatDuration } from "@/lib/utils";
import {
  getSupportedMimeType,
  createAudioUrl,
  revokeAudioUrl,
  DEFAULT_MIME_TYPE,
} from "@/lib/audio";
import {
  MAX_RECORDING_DURATION,
  MIN_RECORDING_DURATION,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import type { VoiceRecording } from "@/types";

interface VoiceRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  className?: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  onError,
  maxDuration = MAX_RECORDING_DURATION,
  className,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const updateAudioLevelRef = useRef<() => void>(() => {});

  useEffect(() => {
    updateAudioLevelRef.current = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationRef.current = requestAnimationFrame(updateAudioLevelRef.current);
    };
  }, []);

  const updateAudioLevel = useCallback(() => {
    updateAudioLevelRef.current();
  }, []);

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    mediaRecorder.stop();
    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType() || DEFAULT_MIME_TYPE;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = createAudioUrl(blob);

        if (duration < MIN_RECORDING_DURATION) {
          revokeAudioUrl(url);
          onError?.("Recording is too short. Please record at least 3 seconds.");
          return;
        }

        const recording: VoiceRecording = {
          id: crypto.randomUUID(),
          blob,
          url,
          duration,
          timestamp: new Date().toISOString(),
        };
        onRecordingComplete(recording);

        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      updateAudioLevel();

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access."
          : "Failed to access microphone. Please check your settings.";
      onError?.(message);
    }
  }, [maxDuration, onRecordingComplete, onError, stopRecording, updateAudioLevel, duration]);

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;

    if (isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      updateAudioLevel();
    } else {
      mediaRecorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [isPaused, maxDuration, stopRecording, updateAudioLevel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const progress = (duration / maxDuration) * 100;

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-200"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className={cn(
              "transition-all duration-300",
              isRecording ? "text-indigo-600" : "text-slate-300"
            )}
            strokeDasharray={`${(progress / 100) * 339.292} 339.292`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">
            {formatDuration(duration)}
          </span>
          <span className="text-xs text-slate-500">
            {formatDuration(maxDuration)}
          </span>
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => {
            const barHeight = Math.min(1, audioLevel * 3) * (1 - Math.abs(i - 10) / 10);
            return (
              <div
                key={i}
                className="w-1 rounded-full bg-indigo-600 transition-all duration-100"
                style={{ height: `${Math.max(4, barHeight * 40)}px` }}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            size="lg"
            className="rounded-full"
          >
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={pauseRecording}
              variant="secondary"
              size="lg"
              className="rounded-full"
            >
              {isPaused ? (
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
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
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              onClick={stopRecording}
              variant="danger"
              size="lg"
              className="rounded-full"
            >
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
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Stop
            </Button>
          </>
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        {isRecording
          ? "Recording in progress. Click stop when finished."
          : "Click the button above to start recording your voice sample."}
      </p>
    </div>
  );
}
