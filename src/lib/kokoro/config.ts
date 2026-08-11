/**
 * Kokoro TTS configuration.
 *
 * All settings are read from environment variables at runtime.
 * Never expose these to the client.
 */

export const kokoroConfig = {
  /** Base URL of the Kokoro TTS server */
  apiUrl: process.env.KOKORO_API_URL || "http://localhost:8000",

  /** Optional API key for authenticated Kokoro servers */
  apiKey: process.env.KOKORO_API_KEY || "",

  /** Default voice if none is selected */
  defaultVoice: "af_heart",

  /** Default speed multiplier */
  defaultSpeed: 1.0,

  /** Minimum allowed speed */
  minSpeed: 0.5,

  /** Maximum allowed speed */
  maxSpeed: 2.0,

  /** Default output format */
  defaultFormat: "mp3" as const,

  /** Maximum text length per request (characters) */
  maxTextLength: 10000,

  /** Request timeout in milliseconds */
  timeoutMs: 60_000,
} as const;

export type KokoroFormat = "mp3" | "wav";
