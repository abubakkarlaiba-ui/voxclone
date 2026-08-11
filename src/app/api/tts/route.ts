import { NextRequest, NextResponse } from "next/server";
import { kokoroConfig } from "@/lib/kokoro/config";
import { getKokoroVoice } from "@/lib/kokoro/voices";

interface TtsRequestBody {
  text?: string;
  voice?: string;
  speed?: number;
  language?: string;
  format?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as TtsRequestBody;
    const { text, voice, speed, language, format } = body;

    // ─── Validate text ───
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Please enter some text first." } },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    if (trimmed.length > kokoroConfig.maxTextLength) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Text is too long. Maximum ${kokoroConfig.maxTextLength.toLocaleString()} characters.` } },
        { status: 400 }
      );
    }

    // ─── Validate voice ───
    const voiceId = voice || kokoroConfig.defaultVoice;
    const voiceInfo = getKokoroVoice(voiceId);
    if (!voiceInfo) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "The selected voice is unavailable." } },
        { status: 400 }
      );
    }

    // ─── Validate speed ───
    const clampedSpeed = Math.max(
      kokoroConfig.minSpeed,
      Math.min(kokoroConfig.maxSpeed, speed ?? kokoroConfig.defaultSpeed)
    );

    // ─── Validate format ───
    const outputFormat = (format === "wav" ? "wav" : "mp3") as string;

    // ─── Call Kokoro TTS server ───
    const kokoroUrl = `${kokoroConfig.apiUrl.replace(/\/+$/, "")}/v1/tts`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (kokoroConfig.apiKey) {
      headers["Authorization"] = `Bearer ${kokoroConfig.apiKey}`;
    }

    const kokoroResponse = await fetch(kokoroUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: trimmed,
        voice: voiceId,
        speed: clampedSpeed,
        lang: voiceInfo.languageCode,
        format: outputFormat,
      }),
      signal: AbortSignal.timeout(kokoroConfig.timeoutMs),
    });

    if (!kokoroResponse.ok) {
      let detail = "Voice generation failed. Please try again.";
      try {
        const errBody = await kokoroResponse.text();
        const parsed = JSON.parse(errBody);
        detail = parsed.detail || parsed.message || detail;
      } catch {
        // keep default
      }

      if (kokoroResponse.status === 503 || kokoroResponse.status === 502) {
        return NextResponse.json(
          { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Kokoro TTS server is unavailable." } },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, error: { code: "TTS_ERROR", message: detail } },
        { status: kokoroResponse.status }
      );
    }

    // ─── Stream audio back to client ───
    const audioBuffer = await kokoroResponse.arrayBuffer();
    const contentType = kokoroResponse.headers.get("content-type") || `audio/${outputFormat === "wav" ? "wav" : "mpeg"}`;

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
        { success: false, error: { code: "TIMEOUT", message: "Kokoro TTS server is unavailable." } },
        { status: 504 }
      );
    }

    console.error("TTS API error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Voice generation failed. Please try again." } },
      { status: 500 }
    );
  }
}
