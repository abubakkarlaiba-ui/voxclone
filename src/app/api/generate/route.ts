import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, GeneratedAudio, GenerateRequest } from "@/types";
import { getProfileById } from "@/lib/voice-store";
import { getVoiceProvider } from "@/lib/voice-provider";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GeneratedAudio>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { voiceId, text, options } = body as GenerateRequest;

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "voiceId is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "text is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Text must be at least ${MIN_TEXT_LENGTH} characters` }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Text must be at most ${MAX_TEXT_LENGTH} characters` }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const profile = await getProfileById(voiceId);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    if (profile.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" }, timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    if (profile.status !== "ready" || !profile.providerVoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PRECONDITION_FAILED",
            message: `Voice profile is not ready for generation (current status: ${profile.status}). Process the voice first.`,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 412 }
      );
    }

    const provider = getVoiceProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "Voice generation service is not configured. Please contact support.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    const caps = provider.getCapabilities();

    const clamped = {
      speed: Math.max(caps.controls.speed.min, Math.min(caps.controls.speed.max, options?.speed ?? caps.controls.speed.default)),
      stability: Math.max(caps.controls.stability.min, Math.min(caps.controls.stability.max, options?.stability ?? caps.controls.stability.default)),
      similarityBoost: Math.max(caps.controls.similarityBoost.min, Math.min(caps.controls.similarityBoost.max, options?.similarityBoost ?? caps.controls.similarityBoost.default)),
      style: Math.max(caps.controls.style.min, Math.min(caps.controls.style.max, options?.style ?? caps.controls.style.default)),
    };

    const outputFormat = options?.format === "wav"
      ? "wav_44100"
      : options?.format === "ogg"
        ? "opus_48000_128"
        : "mp3_44100_128";

    const result = await provider.generateSpeech({
      providerVoiceId: profile.providerVoiceId,
      text: text.trim(),
      voiceSettings: {
        speed: clamped.speed,
        stability: clamped.stability,
        similarityBoost: clamped.similarityBoost,
        style: clamped.style,
        useSpeakerBoost: options?.useSpeakerBoost ?? caps.controls.speakerBoost.default,
      },
      outputFormat: outputFormat as never,
      sampleAudioBase64: profile.samples?.[0]?.url || undefined,
    });

    const audioBase64 = result.audioBuffer.toString("base64");
    const audioUrl = `data:${result.contentType};base64,${audioBase64}`;

    const generated: GeneratedAudio = {
      id: crypto.randomUUID(),
      voiceId,
      text: text.trim(),
      audioUrl,
      duration: result.duration,
      createdAt: new Date().toISOString(),
      status: "completed",
      useClientTts: result.useClientTts || false,
      sampleAudioUrl: profile.samples?.[0]?.url || null,
    };

    return NextResponse.json({
      success: true,
      data: generated,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "GENERATION_ERROR", message: "Speech generation failed. Please try again later." },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
