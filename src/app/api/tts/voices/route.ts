import { NextResponse } from "next/server";

const TTS_SERVER_URL = process.env.TTS_SERVER_URL || "http://localhost:8000";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${TTS_SERVER_URL.replace(/\/+$/, "")}/v1/voices`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: { code: "TTS_ERROR", message: "Failed to load voices" } },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data: data.voices, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAVAILABLE", message: "TTS server unavailable" } },
      { status: 503 }
    );
  }
}
