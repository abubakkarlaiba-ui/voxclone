import { NextRequest, NextResponse } from "next/server";

const FISH_API_KEY = process.env.FISH_API_KEY || "";
const FISH_API_URL = "https://api.fish.audio";

interface TtsRequestBody {
  text?: string;
  voice?: string;
  speed?: number;
  format?: string;
  referenceAudio?: string;
  referenceText?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    if (!FISH_API_KEY) {
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "Fish Audio API key not configured." } },
        { status: 500 }
      );
    }

    const body = (await request.json()) as TtsRequestBody;
    const { text, voice, speed, format, referenceAudio, referenceText } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Please enter some text first." } },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length > 5000) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Text is too long. Maximum 5,000 characters." } },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      text: trimmed,
      format: format === "wav" ? "wav" : "mp3",
    };

    if (referenceAudio) {
      payload.references = [{
        audio: referenceAudio,
        text: referenceText || trimmed.slice(0, 200),
      }];
    } else if (voice) {
      payload.reference_id = voice;
    }

    if (speed && speed !== 1.0) {
      payload.prosody = { speed: Math.max(0.5, Math.min(2.0, speed)) };
    }

    const fishResponse = await fetch(`${FISH_API_URL}/v1/tts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FISH_API_KEY}`,
        "Content-Type": "application/json",
        "model": "s2.1-pro-free",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!fishResponse.ok) {
      let detail = "Voice generation failed.";
      try {
        const errBody = await fishResponse.text();
        const parsed = JSON.parse(errBody);
        detail = parsed.detail || parsed.message || detail;
      } catch {}

      return NextResponse.json(
        { success: false, error: { code: "TTS_ERROR", message: detail } },
        { status: fishResponse.status }
      );
    }

    const audioBuffer = await fishResponse.arrayBuffer();
    const contentType = fishResponse.headers.get("content-type") || "audio/mpeg";

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: { code: "TIMEOUT", message: "Fish Audio API timed out." } },
        { status: 504 }
      );
    }

    console.error("TTS API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Voice generation failed." } },
      { status: 500 }
    );
  }
}
