import { NextRequest, NextResponse } from "next/server";

const TTS_SERVER_URL = process.env.TTS_SERVER_URL || "http://localhost:8000";

interface TtsRequestBody {
  text?: string;
  voice?: string;
  speed?: number;
  format?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as TtsRequestBody;
    const { text, voice, speed, format } = body;

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

    const ttsUrl = `${TTS_SERVER_URL.replace(/\/+$/, "")}/v1/tts`;

    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        voice: voice || "en-US-JennyNeural",
        speed: Math.max(0.5, Math.min(2.0, speed ?? 1.0)),
        format: format === "wav" ? "wav" : "mp3",
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!ttsResponse.ok) {
      let detail = "Voice generation failed. Please try again.";
      try {
        const errBody = await ttsResponse.text();
        const parsed = JSON.parse(errBody);
        detail = parsed.detail || parsed.message || detail;
      } catch {
        // keep default
      }

      if (ttsResponse.status === 502 || ttsResponse.status === 503) {
        return NextResponse.json(
          { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "TTS server is unavailable." } },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, error: { code: "TTS_ERROR", message: detail } },
        { status: ttsResponse.status }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const contentType = ttsResponse.headers.get("content-type") || "audio/mpeg";

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
        { success: false, error: { code: "TIMEOUT", message: "TTS server timed out." } },
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
