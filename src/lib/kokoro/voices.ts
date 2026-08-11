/**
 * Kokoro TTS voice definitions.
 *
 * All voices are defined here so the UI stays in sync.
 * To add or remove voices, edit this single file.
 */

export interface KokoroVoice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: "male" | "female" | "neutral";
  description: string;
}

/**
 * All voices supported by the Kokoro TTS server.
 * The `id` values must match the voice names the Kokoro server expects.
 */
export const KOKORO_VOICES: KokoroVoice[] = [
  // ─── English (American) ───
  { id: "af_heart",    name: "Heart",      language: "English",  languageCode: "en", gender: "female", description: "Warm, friendly female voice" },
  { id: "af_bella",    name: "Bella",      language: "English",  languageCode: "en", gender: "female", description: "Clear, confident female voice" },
  { id: "af_nicole",   name: "Nicole",     language: "English",  languageCode: "en", gender: "female", description: "Soft, gentle female voice" },
  { id: "af_sarah",    name: "Sarah",      language: "English",  languageCode: "en", gender: "female", description: "Professional female voice" },
  { id: "af_sky",      name: "Sky",        language: "English",  languageCode: "en", gender: "female", description: "Bright, energetic female voice" },
  { id: "am_adam",     name: "Adam",       language: "English",  languageCode: "en", gender: "male",   description: "Deep, resonant male voice" },
  { id: "am_michael",  name: "Michael",    language: "English",  languageCode: "en", gender: "male",   description: "Clear, authoritative male voice" },
  { id: "am_fenrir",   name: "Fenrir",     language: "English",  languageCode: "en", gender: "male",   description: "Strong, confident male voice" },
  { id: "am_puck",     name: "Puck",       language: "English",  languageCode: "en", gender: "male",   description: "Playful, upbeat male voice" },
  { id: "am_echo",     name: "Echo",       language: "English",  languageCode: "en", gender: "male",   description: "Calm, measured male voice" },

  // ─── English (British) ───
  { id: "bf_emma",     name: "Emma",       language: "English",  languageCode: "en", gender: "female", description: "Refined British female voice" },
  { id: "bf_isabella", name: "Isabella",   language: "English",  languageCode: "en", gender: "female", description: "Elegant British female voice" },
  { id: "bm_george",   name: "George",     language: "English",  languageCode: "en", gender: "male",   description: "Distinguished British male voice" },
  { id: "bm_lewis",    name: "Lewis",      language: "English",  languageCode: "en", gender: "male",   description: "Natural British male voice" },

  // ─── Japanese ───
  { id: "jf_alpha",    name: "Alpha",      language: "Japanese", languageCode: "ja", gender: "female", description: "Natural Japanese female voice" },
  { id: "jf_gongitsune", name: "Gongitsune", language: "Japanese", languageCode: "ja", gender: "female", description: "Soft Japanese female voice" },
  { id: "jf_nezumi",   name: "Nezumi",     language: "Japanese", languageCode: "ja", gender: "female", description: "Gentle Japanese female voice" },
  { id: "jf_tebukuro", name: "Tebukuro",   language: "Japanese", languageCode: "ja", gender: "female", description: "Clear Japanese female voice" },
  { id: "jm_kumo",     name: "Kumo",       language: "Japanese", languageCode: "ja", gender: "male",   description: "Natural Japanese male voice" },

  // ─── Chinese ───
  { id: "zf_xiaobei",  name: "Xiaobei",    language: "Chinese",  languageCode: "zh", gender: "female", description: "Mandarin female voice" },
  { id: "zf_xiaoni",   name: "Xiaoni",     language: "Chinese",  languageCode: "zh", gender: "female", description: "Warm Mandarin female voice" },
  { id: "zf_xiaoxiao", name: "Xiaoxiao",   language: "Chinese",  languageCode: "zh", gender: "female", description: "Bright Mandarin female voice" },
  { id: "zf_xiaoyi",   name: "Xiaoyi",     language: "Chinese",  languageCode: "zh", gender: "female", description: "Gentle Mandarin female voice" },
  { id: "zm_yunxi",    name: "Yunxi",      language: "Chinese",  languageCode: "zh", gender: "male",   description: "Mandarin male voice" },
  { id: "zm_yunjian",  name: "Yunjian",    language: "Chinese",  languageCode: "zh", gender: "male",   description: "Deep Mandarin male voice" },
  { id: "zm_yunxia",   name: "Yunxia",     language: "Chinese",  languageCode: "zh", gender: "male",   description: "Young Mandarin male voice" },
  { id: "zm_yunyang",  name: "Yunyang",    language: "Chinese",  languageCode: "zh", gender: "male",   description: "Professional Mandarin male voice" },

  // ─── Spanish ───
  { id: "ef_dora",     name: "Dora",       language: "Spanish",  languageCode: "es", gender: "female", description: "Latin American Spanish female voice" },
  { id: "em_alex",     name: "Alex",       language: "Spanish",  languageCode: "es", gender: "male",   description: "Latin American Spanish male voice" },

  // ─── French ───
  { id: "ff_siwis",    name: "Siwis",      language: "French",   languageCode: "fr", gender: "female", description: "French female voice" },
  { id: "fm_lescault", name: "Lescault",   language: "French",   languageCode: "fr", gender: "male",   description: "French male voice" },

  // ─── Hindi ───
  { id: "hf_alpha",    name: "Alpha",      language: "Hindi",    languageCode: "hi", gender: "female", description: "Hindi female voice" },
  { id: "hm_mahua",    name: "Mahua",      language: "Hindi",    languageCode: "hi", gender: "male",   description: "Hindi male voice" },

  // ─── Italian ───
  { id: "if_sara",     name: "Sara",       language: "Italian",  languageCode: "it", gender: "female", description: "Italian female voice" },
  { id: "im_nicola",   name: "Nicola",     language: "Italian",  languageCode: "it", gender: "male",   description: "Italian male voice" },

  // ─── Portuguese ───
  { id: "pf_dora",     name: "Dora",       language: "Portuguese", languageCode: "pt", gender: "female", description: "Portuguese female voice" },
  { id: "pm_alex",     name: "Alex",       language: "Portuguese", languageCode: "pt", gender: "male",   description: "Portuguese male voice" },

  // ─── Korean ───
  { id: "kf_alpha",    name: "Alpha",      language: "Korean",   languageCode: "ko", gender: "female", description: "Korean female voice" },
  { id: "km_sky",      name: "Sky",        language: "Korean",   languageCode: "ko", gender: "male",   description: "Korean male voice" },
];

/**
 * Get a voice by its ID.
 */
export function getKokoroVoice(id: string): KokoroVoice | undefined {
  return KOKORO_VOICES.find((v) => v.id === id);
}

/**
 * Get all unique languages available.
 */
export function getKokoroLanguages(): { code: string; name: string }[] {
  const map = new Map<string, string>();
  for (const v of KOKORO_VOICES) {
    if (!map.has(v.languageCode)) map.set(v.languageCode, v.language);
  }
  return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
}

/**
 * Filter voices by language code.
 */
export function getKokoroVoicesByLanguage(langCode: string): KokoroVoice[] {
  return KOKORO_VOICES.filter((v) => v.languageCode === langCode);
}
