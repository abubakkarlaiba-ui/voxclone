export interface VoiceSample {
  id: string;
  filename: string;
  url: string;
  blob: Blob | null;
  duration: number;
  size: number;
  mimeType: string;
  source: "recording" | "upload";
  createdAt: string;
}

export type VoiceProfileStatus =
  | "draft"
  | "processing"
  | "ready"
  | "failed";

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  status: VoiceProfileStatus;
  samples: VoiceSample[];
  totalDuration: number;
  providerVoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

export interface CreateVoiceProfileRequest {
  name: string;
  description?: string;
}

export interface UpdateVoiceProfileRequest {
  name?: string;
  description?: string;
}

export interface AddSampleRequest {
  filename: string;
  size: number;
  mimeType: string;
  duration: number;
  source: "recording" | "upload";
}

export interface VoiceRecording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: string;
}

export interface GeneratedAudio {
  id: string;
  voiceId: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
  status: GenerationStatus;
}

export type GenerationStatus = "pending" | "generating" | "completed" | "error";

export interface GenerateRequest {
  voiceId: string;
  text: string;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  speed?: number;
  pitch?: number;
  format?: "mp3" | "wav" | "ogg";
}
