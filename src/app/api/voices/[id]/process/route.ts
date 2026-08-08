import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceProfile } from "@/types";
import { getProfileById, updateProfile } from "@/lib/voice-store";
import { getVoiceProvider, VoiceProviderError } from "@/lib/voice-provider";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<VoiceProfile>>> {
  try {
    const { id } = await params;
    const profile = getProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    if (profile.samples.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Add at least one voice sample before processing" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (profile.status === "processing") {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Voice is already being processed" }, timestamp: new Date().toISOString() },
        { status: 409 }
      );
    }

    const provider = getVoiceProvider();

    if (!provider.isConfigured()) {
      updateProfile(id, {
        status: "failed",
        errorMessage: "Voice API not configured. Set ELEVENLABS_API_KEY in .env.local.",
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "Voice generation service not configured. Set ELEVENLABS_API_KEY environment variable.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    updateProfile(id, { status: "processing", errorMessage: null });

    const sampleBuffers: { filename: string; mimeType: string; buffer: Buffer }[] = [];

    for (const sample of profile.samples) {
      if (sample.blob) {
        const arrayBuffer = await sample.blob.arrayBuffer();
        sampleBuffers.push({
          filename: sample.filename,
          mimeType: sample.mimeType,
          buffer: Buffer.from(arrayBuffer),
        });
      } else if (sample.url && sample.url.startsWith("data:")) {
        const base64 = sample.url.split(",")[1];
        if (base64) {
          sampleBuffers.push({
            filename: sample.filename,
            mimeType: sample.mimeType,
            buffer: Buffer.from(base64, "base64"),
          });
        }
      }
    }

    if (sampleBuffers.length === 0) {
      updateProfile(id, {
        status: "failed",
        errorMessage: "No audio data available for processing. Re-record or re-upload samples.",
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No processable audio data found in samples. Audio blobs are only available in the current browser session.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    try {
      const cloneResult = await provider.cloneVoice({
        name: profile.name,
        description: profile.description || undefined,
        samples: sampleBuffers,
      });

      const updated = updateProfile(id, {
        status: "ready",
        providerVoiceId: cloneResult.providerVoiceId,
        processedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: updated!,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      let errorMessage = "Voice processing failed";

      if (error instanceof VoiceProviderError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      updateProfile(id, {
        status: "failed",
        errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROCESSING_ERROR",
            message: errorMessage,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to start processing" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
