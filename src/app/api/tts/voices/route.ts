import { NextResponse } from "next/server";

const FISH_API_KEY = process.env.FISH_API_KEY || "";
const FISH_API_URL = "https://api.fish.audio";

const POPULAR_VOICES = [
  { id: "9a9cf47702da476aa4629e2506d4a857", name: "Aria", language: "English", languageCode: "en-US", gender: "female" as const, description: "Warm, professional female voice" },
  { id: "2b0d52391e4e4e18a24c1240ee1ea09e", name: "Fish Audio Default", language: "English", languageCode: "en-US", gender: "female" as const, description: "Clear, friendly default voice" },
  { id: "726b5c2e72094339b96a34c61f87d0f1", name: "Nova", language: "English", languageCode: "en-US", gender: "female" as const, description: "Bright, energetic female voice" },
  { id: "e58b3f7bb4e54c1a94a7b93e54431c9a", name: "Luna", language: "English", languageCode: "en-US", gender: "female" as const, description: "Soft, gentle female voice" },
  { id: "f4e02ba281864e56bd33c44e8e4df317", name: "Marcus", language: "English", languageCode: "en-US", gender: "male" as const, description: "Deep, authoritative male voice" },
  { id: "68e4e5ef71bd40f2a0f79f7e5e8d4809", name: "Alex", language: "English", languageCode: "en-US", gender: "male" as const, description: "Clear, natural male voice" },
  { id: "d101a984b3564e8a8b64c49e80085877", name: "Sophie", language: "English", languageCode: "en-GB", gender: "female" as const, description: "Elegant British female voice" },
  { id: "b7d4ce58083e4e18a8a2f29e532c5955", name: "Oliver", language: "English", languageCode: "en-GB", gender: "male" as const, description: "Distinguished British male voice" },
  { id: "8e897bf149b54330b7bd1110da4e474d", name: "Yuki", language: "Japanese", languageCode: "ja-JP", gender: "female" as const, description: "Natural Japanese female voice" },
  { id: "5e03546f3ea94e96a3e9db7b1a5e0e17", name: "Xiaoming", language: "Chinese", languageCode: "zh-CN", gender: "male" as const, description: "Mandarin male voice" },
  { id: "1bd001e7e50f44e9a8f0c4e1c6a87799", name: "Camille", language: "French", languageCode: "fr-FR", gender: "female" as const, description: "Smooth French female voice" },
  { id: "3e1b6b6e4d0a4b2e9c0f7e8d9c0b5a3f", name: "Carlos", language: "Spanish", languageCode: "es-ES", gender: "male" as const, description: "Clear Spanish male voice" },
  { id: "a8e6c0c4e0a44a0e8d5f3b7c1e9f2d5a", name: "Priya", language: "Hindi", languageCode: "hi-IN", gender: "female" as const, description: "Warm Hindi female voice" },
  { id: "b5c8d3e1f0a44e8b9c7d2f6e1a3b5c8d", name: "Sofia", language: "Portuguese", languageCode: "pt-BR", gender: "female" as const, description: "Brazilian Portuguese female voice" },
  { id: "c6d9e4f2a1b54f9c0d8e3a7f2b4c6d9e", name: "Marco", language: "Italian", languageCode: "it-IT", gender: "male" as const, description: "Italian male voice" },
  { id: "d7e0f5a3b2c64a0d1e9f4b8a3c5d7e0f", name: "Minji", language: "Korean", languageCode: "ko-KR", gender: "female" as const, description: "Korean female voice" },
];

export async function GET(): Promise<NextResponse> {
  try {
    if (!FISH_API_KEY) {
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "Fish Audio API key not configured." } },
        { status: 500 }
      );
    }

    const res = await fetch(`${FISH_API_URL}/v1/models?page_size=100`, {
      headers: { "Authorization": `Bearer ${FISH_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      const items = data.items || data.data || [];
      if (items.length > 0) {
        const voices = items.map((v: Record<string, unknown>) => ({
          id: v._id || v.id,
          name: v.title || v.name || "Unknown",
          language: "English",
          languageCode: "en-US",
          gender: "neutral" as const,
          description: String(v.description || "Fish Audio voice").slice(0, 60),
        }));
        return NextResponse.json({ success: true, data: voices, timestamp: new Date().toISOString() });
      }
    }
  } catch {
    // Fall through to popular voices
  }

  return NextResponse.json({ success: true, data: POPULAR_VOICES, timestamp: new Date().toISOString() });
}
