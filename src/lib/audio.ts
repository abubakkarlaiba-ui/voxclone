import { DEFAULT_AUDIO_FORMAT } from "./constants";

export function getSupportedMimeType(): string | null {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/wav"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

export function isPauseSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && "pause" in MediaRecorder.prototype;
}

export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export async function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
      audio.src = "";
    });
    audio.addEventListener("error", () => {
      reject(new Error("Failed to load audio metadata"));
      audio.src = "";
    });
    audio.src = url;
  });
}

export function audioBlobToFile(blob: Blob, filename: string): File {
  const extension = blob.type.split("/")[1]?.split(";")[0] || "webm";
  return new File([blob], `${filename}.${extension}`, { type: blob.type });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const DEFAULT_MIME_TYPE = DEFAULT_AUDIO_FORMAT;
