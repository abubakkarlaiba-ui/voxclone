import type {
  VoiceProvider,
  VoiceProviderConfig,
  CloneVoiceRequest,
  CloneVoiceResponse,
  GenerateSpeechRequest,
  GenerateSpeechResponse,
  ProviderCapabilities,
} from "./types";
import {
  VoiceProviderError,
  VoiceProviderTimeoutError,
  VoiceProviderAuthError,
  VoiceProviderRateLimitError,
  VoiceCloneError,
  SpeechGenerationError,
} from "./errors";

const DEFAULT_BASE_URL = "https://api.elevenlabs.io";
const DEFAULT_TIMEOUT = 60_000;
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export class ElevenLabsProvider implements VoiceProvider {
  readonly name = "elevenlabs";
  private config: VoiceProviderConfig;

  constructor(config: VoiceProviderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
    };
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.length > 0);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      provider: "elevenlabs",
      controls: {
        speed: {
          min: 0.7, max: 1.2, step: 0.05, default: 1,
          tooltip: "Adjusts speech rate. Values below 1.0 slow down, above 1.0 speed up.",
        },
        stability: {
          min: 0, max: 1, step: 0.05, default: 0.5,
          tooltip: "Higher values produce more consistent, monotone speech. Lower values add emotional range.",
        },
        similarityBoost: {
          min: 0, max: 1, step: 0.05, default: 0.75,
          tooltip: "How closely the AI adheres to the original voice. Higher = closer match.",
        },
        style: {
          min: 0, max: 1, step: 0.05, default: 0,
          tooltip: "Exaggerates the speaking style. Higher values amplify expressiveness but may sound unnatural.",
        },
        speakerBoost: {
          default: true,
          tooltip: "Boosts similarity to the original speaker. Slightly increases latency.",
        },
        languages: [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
          { code: "de", name: "German" },
          { code: "it", name: "Italian" },
          { code: "pt", name: "Portuguese" },
          { code: "pl", name: "Polish" },
          { code: "hi", name: "Hindi" },
          { code: "ar", name: "Arabic" },
          { code: "ja", name: "Japanese" },
          { code: "ko", name: "Korean" },
          { code: "zh", name: "Chinese" },
        ],
        formats: [
          { value: "mp3", label: "MP3" },
          { value: "wav", label: "WAV" },
          { value: "ogg", label: "OGG" },
        ],
      },
    };
  }

  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    const url = `${this.config.baseUrl}/v1/voices/add`;

    const formData = new FormData();
    formData.append("name", request.name);

    if (request.description) {
      formData.append("description", request.description);
    }

    if (request.labels) {
      formData.append("labels", JSON.stringify(request.labels));
    }

    for (const sample of request.samples) {
      const uint8 = new Uint8Array(sample.buffer);
      const blob = new Blob([uint8], { type: sample.mimeType });
      formData.append("files", blob, sample.filename);
    }

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, "cloneVoice");
    }

    const data = (await response.json()) as {
      voice_id: string;
      requires_verification: boolean;
    };

    return {
      providerVoiceId: data.voice_id,
      requiresVerification: data.requires_verification,
    };
  }

  async generateSpeech(
    request: GenerateSpeechRequest
  ): Promise<GenerateSpeechResponse> {
    const outputFormat = request.outputFormat || "mp3_44100_128";
    const url = `${this.config.baseUrl}/v1/text-to-speech/${request.providerVoiceId}?output_format=${outputFormat}`;

    const body: Record<string, unknown> = {
      text: request.text,
      model_id: request.modelId || DEFAULT_MODEL_ID,
    };

    if (request.voiceSettings) {
      body.voice_settings = {
        stability: request.voiceSettings.stability ?? 0.5,
        similarity_boost: request.voiceSettings.similarityBoost ?? 0.75,
        style: request.voiceSettings.style ?? 0,
        use_speaker_boost: request.voiceSettings.useSpeakerBoost ?? true,
        speed: request.voiceSettings.speed ?? 1,
      };
    }

    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, "generateSpeech");
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    const duration = this.estimateAudioDuration(audioBuffer, outputFormat);

    return { audioBuffer, contentType, duration };
  }

  async deleteVoice(providerVoiceId: string): Promise<void> {
    const url = `${this.config.baseUrl}/v1/voices/${providerVoiceId}`;

    const response = await this.fetchWithTimeout(url, {
      method: "DELETE",
      headers: {
        "xi-api-key": this.config.apiKey,
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, "deleteVoice");
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new VoiceProviderTimeoutError(this.name, this.config.timeout!);
      }
      throw new VoiceProviderError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        undefined,
        this.name,
        error instanceof Error ? error : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleErrorResponse(
    response: Response,
    operation: string
  ): Promise<never> {
    let detail: string;
    try {
      const body = (await response.json()) as { detail?: string; error?: { message?: string } };
      detail = body.detail || body.error?.message || response.statusText;
    } catch {
      detail = response.statusText;
    }

    switch (response.status) {
      case 401:
        throw new VoiceProviderAuthError(this.name, detail);
      case 429: {
        const retryAfter = response.headers.get("retry-after");
        throw new VoiceProviderRateLimitError(
          this.name,
          retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
        );
      }
      default:
        if (operation === "cloneVoice") {
          throw new VoiceCloneError(this.name, detail);
        }
        throw new SpeechGenerationError(this.name, detail);
    }
  }

  private estimateAudioDuration(buffer: Buffer, format: string): number {
    const bitrateMap: Record<string, number> = {
      mp3_44100_128: 128_000,
      mp3_44100_192: 192_000,
      mp3_22050_32: 32_000,
      mp3_44100_64: 64_000,
      mp3_44100_96: 96_000,
      opus_48000_128: 128_000,
      opus_48000_192: 192_000,
      pcm_44100: 44100 * 16 * 1,
      wav_44100: 44100 * 16 * 1,
    };

    const bitrate = bitrateMap[format] || 128_000;
    const bytesPerSecond = bitrate / 8;
    return buffer.length / bytesPerSecond;
  }
}
