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
  timeoutMs: 120_000,
} as const;

/**
 * Map of language codes to Kokoro's single-letter lang codes.
 * Kokoro uses: a=American English, b=British English, e=Spanish,
 * f=French, h=Hindi, i=Italian, p=Portuguese, j=Japanese, z=Chinese
 */
export const KOKORO_LANG_MAP: Record<string, string> = {
  en: "a",
  ja: "j",
  zh: "z",
  es: "e",
  fr: "f",
  hi: "h",
  it: "i",
  pt: "p",
  ko: "a",
};

export type KokoroFormat = "mp3" | "wav";
