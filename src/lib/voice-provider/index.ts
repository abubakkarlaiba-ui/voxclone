import type { VoiceProvider } from "./types";
import { ElevenLabsProvider } from "./elevenlabs";
import { MockVoiceProvider } from "./mock";

let cachedProvider: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VOICE_API_KEY;
  const providerEnv = process.env.VOICE_PROVIDER;
  const baseUrl = process.env.ELEVENLABS_API_BASE_URL;

  const useElevenLabs =
    providerEnv === "elevenlabs" || (!providerEnv && apiKey);

  if (useElevenLabs && apiKey) {
    cachedProvider = new ElevenLabsProvider({
      apiKey,
      baseUrl: baseUrl || undefined,
    });
  } else {
    cachedProvider = new MockVoiceProvider();
  }

  return cachedProvider;
}

export function resetProvider(): void {
  cachedProvider = null;
}

export type {
  VoiceProvider,
  VoiceProviderConfig,
  CloneVoiceRequest,
  CloneVoiceResponse,
  GenerateSpeechRequest,
  GenerateSpeechResponse,
  VoiceSettings,
  OutputFormat,
  VoiceProviderSample,
} from "./types";

export {
  VoiceProviderError,
  VoiceProviderTimeoutError,
  VoiceProviderAuthError,
  VoiceProviderRateLimitError,
  VoiceCloneError,
  SpeechGenerationError,
} from "./errors";

export { ElevenLabsProvider } from "./elevenlabs";
export { MockVoiceProvider } from "./mock";
