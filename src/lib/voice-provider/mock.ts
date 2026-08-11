import type {
  VoiceProvider,
  CloneVoiceRequest,
  CloneVoiceResponse,
  GenerateSpeechRequest,
  GenerateSpeechResponse,
  ProviderCapabilities,
} from "./types";

/**
 * Mock voice provider for development and testing.
 *
 * Generates actual audible WAV audio with speech-like tones
 * so the UI can be tested without an API key.
 */
export class MockVoiceProvider implements VoiceProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      provider: "mock",
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
    await this.simulateDelay(800, 1500);

    const seed = request.name.replace(/\s+/g, "-").toLowerCase();
    const providerVoiceId = `mock-voice-${seed}-${Date.now().toString(36)}`;

    return {
      providerVoiceId,
      requiresVerification: false,
    };
  }

  async generateSpeech(
    request: GenerateSpeechRequest
  ): Promise<GenerateSpeechResponse> {
    await this.simulateDelay(500, 1000);

    const wordCount = request.text.split(/\s+/).length;
    const speed = request.voiceSettings?.speed ?? 1;
    const estimatedDuration = Math.max(1, (wordCount / 150) * 60 / speed);

    const audioBuffer = this.generateSpeechWav(request.text, estimatedDuration);

    return {
      audioBuffer,
      contentType: "audio/wav",
      duration: estimatedDuration,
      useClientTts: true,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteVoice(_providerVoiceId: string): Promise<void> {
    await this.simulateDelay(200, 500);
  }

  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Generates a WAV file with speech-like tones.
   * Each word gets a unique pitch based on its character hash,
   * creating a melodic pattern that simulates speech rhythm.
   */
  private generateSpeechWav(text: string, durationSeconds: number): Buffer {
    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const words = text.split(/\s+/).filter(Boolean);

    const totalSamples = Math.ceil(sampleRate * durationSeconds);
    const samples = new Int16Array(totalSamples);

    const wordsPerSecond = words.length / durationSeconds;
    const samplesPerWord = Math.ceil(sampleRate / wordsPerSecond);

    for (let i = 0; i < totalSamples; i++) {
      const wordIndex = Math.floor(i / samplesPerWord) % Math.max(1, words.length);
      const word = words[wordIndex] || "hello";
      const wordProgress = (i % samplesPerWord) / samplesPerWord;

      const baseFreq = this.hashWord(word);
      const freq = baseFreq + Math.sin(wordProgress * Math.PI) * 50;

      const envelope = this.speechEnvelope(wordProgress);

      const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 5 * i / sampleRate);
      const sample = Math.sin(2 * Math.PI * freq * vibrato * i / sampleRate);

      const harmonics =
        0.3 * Math.sin(2 * Math.PI * freq * 2 * i / sampleRate) +
        0.15 * Math.sin(2 * Math.PI * freq * 3 * i / sampleRate) +
        0.08 * Math.sin(2 * Math.PI * freq * 4 * i / sampleRate);

      const combined = (sample + harmonics) * envelope * 0.35;
      samples[i] = Math.max(-32768, Math.min(32767, Math.round(combined * 32767)));
    }

    const dataSize = totalSamples * (bitsPerSample / 8);
    const headerSize = 44;
    const buffer = Buffer.alloc(headerSize + dataSize);

    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < totalSamples; i++) {
      buffer.writeInt16LE(samples[i], headerSize + i * 2);
    }

    return buffer;
  }

  private hashWord(word: string): number {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    const normalized = (Math.abs(hash) % 200) / 200;
    return 180 + normalized * 220;
  }

  private speechEnvelope(t: number): number {
    if (t < 0.05) return t / 0.05;
    if (t > 0.85) return (1 - t) / 0.15;
    return 0.6 + 0.4 * Math.sin((t - 0.05) / 0.8 * Math.PI);
  }
}
