import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceProfile } from "@/types";
import { getProfileById, updateProfile } from "@/lib/voice-store";
import { getVoiceProvider, VoiceProviderError } from "@/lib/voice-provider";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<VoiceProfile>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const { id } = await params;
    const profile = await getProfileById(id);

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
      await updateProfile(id, {
        status: "failed",
        errorMessage: "Voice API not configured.",
      });

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

    await updateProfile(id, { status: "processing", errorMessage: null });

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
      await updateProfile(id, {
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

      const updated = await updateProfile(id, {
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
      const isProviderError = error instanceof VoiceProviderError;
      const errorMessage = isProviderError
        ? "Voice processing failed. Please try again later."
        : "Voice processing failed. Please try again later.";

      await updateProfile(id, {
        status: "failed",
        errorMessage: "Voice processing failed.",
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isProviderError ? error.code : "PROCESSING_ERROR",
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
