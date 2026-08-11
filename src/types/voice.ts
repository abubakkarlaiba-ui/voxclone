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
  userId: string;
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
  audioData?: string;
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
  useClientTts?: boolean;
  sampleAudioUrl?: string | null;
}

export type GenerationStatus = "pending" | "generating" | "completed" | "error";

export interface GenerateRequest {
  voiceId: string;
  text: string;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  speed?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  language?: string;
  format?: "mp3" | "wav" | "ogg";
}

export interface ProviderCapabilities {
  provider: string;
  controls: {
    speed: { min: number; max: number; step: number; default: number; tooltip: string };
    stability: { min: number; max: number; step: number; default: number; tooltip: string };
    similarityBoost: { min: number; max: number; step: number; default: number; tooltip: string };
    style: { min: number; max: number; step: number; default: number; tooltip: string };
    speakerBoost: { default: boolean; tooltip: string };
    languages: { code: string; name: string }[];
    formats: { value: string; label: string }[];
  };
}

export interface HistoryItem {
  id: string;
  userId: string;
  voiceId: string;
  voiceName: string;
  text: string;
  audioUrl: string;
  duration: number;
  format: string;
  options: GenerateOptions;
  createdAt: string;
}

export interface HistoryListParams {
  page: number;
  pageSize: number;
  search?: string;
  voiceId?: string;
}

export interface HistoryListResult {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
