"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  getSupportedMimeType,
  createAudioUrl,
  revokeAudioUrl,
  isRecordingSupported,
  isPauseSupported,
} from "@/lib/audio";
import { MAX_RECORDING_DURATION, MIN_RECORDING_DURATION } from "@/lib/constants";
import type { VoiceRecording } from "@/types";

export type RecorderPermission = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export type RecorderState = "idle" | "recording" | "paused" | "stopped";

interface UseAudioRecorderOptions {
  maxDuration?: number;
  minDuration?: number;
  onRecordingComplete?: (recording: VoiceRecording) => void;
  onError?: (error: string) => void;
}

interface UseAudioRecorderReturn {
  state: RecorderState;
  permission: RecorderPermission;
  duration: number;
  maxDuration: number;
  audioLevel: number;
  waveform: Uint8Array;
  recording: VoiceRecording | null;
  isPauseSupported: boolean;
  requestPermission: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  discardRecording: () => void;
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const {
    maxDuration = MAX_RECORDING_DURATION,
    minDuration = MIN_RECORDING_DURATION,
    onRecordingComplete,
    onError,
  } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [permission, setPermission] = useState<RecorderPermission>(
    isRecordingSupported() ? "idle" : "unsupported"
  );
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveform, setWaveform] = useState<Uint8Array>(() => new Uint8Array(64));
  const [recording, setRecording] = useState<VoiceRecording | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const durationRef = useRef(0);
  const stateRef = useRef<RecorderState>("idle");
  const permissionRef = useRef<RecorderPermission>(permission);

  // Keep refs in sync
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  // Waveform + level animation loop
  const waveformLoopRef = useRef<() => void>(() => {});
  useEffect(() => {
    waveformLoopRef.current = () => {
      if (!analyserRef.current) return;
      const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(freqData);

      // Compute average level
      const avg = freqData.reduce((a, b) => a + b, 0) / freqData.length;
      setAudioLevel(avg / 255);

      // Downsample to 64 bars for waveform display
      const bars = 64;
      const step = Math.floor(freqData.length / bars);
      const waveformSlice = new Uint8Array(bars);
      for (let i = 0; i < bars; i++) {
        const start = i * step;
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += freqData[start + j] ?? 0;
        }
        waveformSlice[i] = sum / step;
      }
      setWaveform(waveformSlice);

      animationRef.current = requestAnimationFrame(waveformLoopRef.current);
    };
  }, []);

  const startWaveform = useCallback(() => {
    waveformLoopRef.current();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
    setWaveform(new Uint8Array(64));
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        if (next >= maxDuration) {
          // Auto-stop handled by caller via ref
          return next;
        }
        return next;
      });
    }, 1000);
  }, [maxDuration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-stop at max duration
  const stopRecordingRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (duration >= maxDuration && stateRef.current === "recording") {
      stopRecordingRef.current();
    }
  }, [duration, maxDuration]);

  const cleanup = useCallback(() => {
    stopTimer();
    stopWaveform();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, [stopTimer, stopWaveform]);

  const requestPermission = useCallback(async () => {
    if (!isRecordingSupported()) {
      setPermission("unsupported");
      onError?.("Your browser does not support audio recording.");
      return;
    }

    setPermission("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Got permission — stop the stream immediately, we just needed to check
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermission("denied");
          onError?.("Microphone permission denied. Please allow microphone access in your browser settings.");
          return;
        }
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setPermission("denied");
          onError?.("No microphone found. Please connect a microphone and try again.");
          return;
        }
      }
      setPermission("denied");
      onError?.("Failed to access microphone. Please check your settings.");
    }
  }, [onError]);

  const startRecording = useCallback(async () => {
    if (state !== "idle" && state !== "stopped") return;

    // Check permission first
    if (permissionRef.current !== "granted") {
      await requestPermission();
    }

    // Verify permission was granted (ref updated by effect after requestPermission)
    const currentPermission = permissionRef.current;
    if (currentPermission !== "granted") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        onError?.("No supported audio format found in your browser.");
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      // Audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      // Store refs
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        onError?.("Recording error occurred. Please try again.");
        cleanup();
        setState("idle");
      };

      recorder.onstop = () => {
        const finalDuration = durationRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = createAudioUrl(blob);

        cleanup();

        if (finalDuration < minDuration) {
          revokeAudioUrl(url);
          onError?.(
            `Recording too short. Please record for at least ${minDuration} seconds.`
          );
          setState("idle");
          setDuration(0);
          return;
        }

        const result: VoiceRecording = {
          id: crypto.randomUUID(),
          blob,
          url,
          duration: finalDuration,
          timestamp: new Date().toISOString(),
        };

        setRecording(result);
        setState("stopped");
        onRecordingComplete?.(result);
      };

      // Start
      recorder.start(100);
      setState("recording");
      setDuration(0);
      setRecording(null);
      startWaveform();
      startTimer();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermission("denied");
        onError?.("Microphone access denied. Please allow microphone access.");
      } else {
        onError?.("Failed to start recording. Please try again.");
      }
      cleanup();
      setState("idle");
    }
  }, [state, requestPermission, minDuration, onError, cleanup, startWaveform, startTimer, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    stopTimer();
    stopWaveform();

    // recorder.onstop will handle the rest
    recorder.stop();
  }, [stopTimer, stopWaveform]);

  // Sync ref for auto-stop effect
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    recorder.pause();
    setState("paused");
    stopTimer();
    stopWaveform();
  }, [stopTimer, stopWaveform]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;

    recorder.resume();
    setState("recording");
    startTimer();
    startWaveform();
  }, [startTimer, startWaveform]);

  const discardRecording = useCallback(() => {
    if (recording?.url) {
      revokeAudioUrl(recording.url);
    }
    cleanup();
    setRecording(null);
    setState("idle");
    setDuration(0);
    setAudioLevel(0);
    setWaveform(new Uint8Array(64));
    chunksRef.current = [];
  }, [recording, cleanup]);

  // Warn before leaving with active recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current === "recording" || stateRef.current === "paused") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (recording?.url) {
        revokeAudioUrl(recording.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    permission,
    duration,
    maxDuration,
    audioLevel,
    waveform,
    recording,
    isPauseSupported: isPauseSupported(),
    requestPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
  };
}
