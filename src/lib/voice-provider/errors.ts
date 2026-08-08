export class VoiceProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly provider?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "VoiceProviderError";
  }
}

export class VoiceProviderTimeoutError extends VoiceProviderError {
  constructor(provider: string, timeoutMs: number) {
    super(
      `${provider} request timed out after ${timeoutMs}ms`,
      "PROVIDER_TIMEOUT",
      undefined,
      provider
    );
    this.name = "VoiceProviderTimeoutError";
  }
}

export class VoiceProviderAuthError extends VoiceProviderError {
  constructor(provider: string, detail?: string) {
    super(
      `${provider} authentication failed${detail ? `: ${detail}` : ""}`,
      "PROVIDER_AUTH_ERROR",
      401,
      provider
    );
    this.name = "VoiceProviderAuthError";
  }
}

export class VoiceProviderRateLimitError extends VoiceProviderError {
  constructor(provider: string, retryAfterMs?: number) {
    super(
      `${provider} rate limit exceeded${retryAfterMs ? `, retry after ${retryAfterMs}ms` : ""}`,
      "PROVIDER_RATE_LIMIT",
      429,
      provider
    );
    this.name = "VoiceProviderRateLimitError";
  }
}

export class VoiceCloneError extends VoiceProviderError {
  constructor(provider: string, detail?: string) {
    super(
      `Voice cloning failed${detail ? `: ${detail}` : ""}`,
      "VOICE_CLONE_ERROR",
      undefined,
      provider
    );
    this.name = "VoiceCloneError";
  }
}

export class SpeechGenerationError extends VoiceProviderError {
  constructor(provider: string, detail?: string) {
    super(
      `Speech generation failed${detail ? `: ${detail}` : ""}`,
      "SPEECH_GENERATION_ERROR",
      undefined,
      provider
    );
    this.name = "SpeechGenerationError";
  }
}
