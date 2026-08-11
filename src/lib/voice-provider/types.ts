export interface VoiceProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface CloneVoiceRequest {
  name: string;
  description?: string;
  samples: VoiceProviderSample[];
  labels?: Record<string, string>;
}

export interface VoiceProviderSample {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface CloneVoiceResponse {
  providerVoiceId: string;
  requiresVerification: boolean;
}

export interface GenerateSpeechRequest {
  providerVoiceId: string;
  text: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
  outputFormat?: OutputFormat;
  sampleAudioBase64?: string;
}

export interface VoiceSettings {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  useSpeakerBoost?: boolean;
}

export type OutputFormat =
  | "mp3_44100_128"
  | "mp3_44100_192"
  | "mp3_22050_32"
  | "pcm_44100"
  | "wav_44100"
  | "opus_48000_128";

export interface GenerateSpeechResponse {
  audioBuffer: Buffer;
  contentType: string;
  duration: number;
  useClientTts?: boolean;
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

export interface VoiceProvider {
  readonly name: string;

  cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse>;

  generateSpeech(request: GenerateSpeechRequest): Promise<GenerateSpeechResponse>;

  deleteVoice(providerVoiceId: string): Promise<void>;

  isConfigured(): boolean;

  getCapabilities(): ProviderCapabilities;
}
