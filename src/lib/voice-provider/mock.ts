import type {
  VoiceProvider,
  CloneVoiceRequest,
  CloneVoiceResponse,
  GenerateSpeechRequest,
  GenerateSpeechResponse,
} from "./types";

/**
 * Mock voice provider for development and testing.
 *
 * - cloneVoice: returns a deterministic fake voice ID
 * - generateSpeech: returns a silent audio buffer with correct headers
 *
 * All operations are simulated with realistic delays.
 */
export class MockVoiceProvider implements VoiceProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
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
    await this.simulateDelay(1000, 3000);

    const wordCount = request.text.split(/\s+/).length;
    const estimatedDuration = Math.max(1, (wordCount / 150) * 60);

    const audioBuffer = this.generateSilentMp3(estimatedDuration);

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      duration: estimatedDuration,
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
   * Generates a minimal valid MP3 file of silent audio.
   * This creates a real MP3 file that browsers can play.
   */
  private generateSilentMp3(durationSeconds: number): Buffer {
    const framesPerSecond = 38.28125;
    const totalFrames = Math.ceil(durationSeconds * framesPerSecond);

    const frameSize = 417;
    const headerSize = 4;
    const xingHeaderSize = 196;
    const totalSize = headerSize + xingHeaderSize + totalFrames * frameSize;

    const buffer = Buffer.alloc(totalSize);

    buffer[0] = 0xff;
    buffer[1] = 0xfb;
    buffer[2] = 0x90;
    buffer[3] = 0x00;

    let offset = headerSize + xingHeaderSize;
    for (let i = 0; i < totalFrames; i++) {
      buffer[offset] = 0xff;
      buffer[offset + 1] = 0xfb;
      buffer[offset + 2] = 0x90;
      buffer[offset + 3] = 0x00;
      offset += frameSize;
    }

    return buffer;
  }
}
