import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceSample, AddSampleRequest } from "@/types";
import { getProfileById, updateProfile } from "@/lib/voice-store";
import { getAuthenticatedUser } from "@/lib/api-auth";

const MAX_SAMPLES_PER_PROFILE = 20;
const MAX_DURATION_SECONDS = 600;
const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/wav",
  "audio/mp3",
  "audio/ogg",
  "audio/mpeg",
  "audio/x-wav",
  "audio/wave",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<VoiceSample[]>>> {
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

    return NextResponse.json({
      success: true,
      data: profile.samples,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch samples" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<VoiceSample>>> {
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

    if (profile.samples.length >= MAX_SAMPLES_PER_PROFILE) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Maximum of ${MAX_SAMPLES_PER_PROFILE} samples per voice profile` }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { filename, size, mimeType, duration, source } = body as AddSampleRequest;

    if (!filename || typeof filename !== "string" || filename.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Filename is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (filename.length > 255) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Filename too long" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const normalizedMime = mimeType?.split(";")[0]?.trim().toLowerCase() || "";

    if (!mimeType || typeof mimeType !== "string" || !ALLOWED_MIME_TYPES.includes(normalizedMime)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Unsupported audio format. Use WebM, WAV, MP3, or OGG." }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (typeof duration !== "number" || duration <= 0 || duration > MAX_DURATION_SECONDS) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Duration must be between 1 and ${MAX_DURATION_SECONDS} seconds` }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (typeof size === "number" && size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "File size exceeds 50MB limit" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const validSources = ["recording", "upload"];
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid source type" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const sample: VoiceSample = {
      id: crypto.randomUUID(),
      filename: filename.trim(),
      url: "",
      blob: null,
      duration,
      size: size || 0,
      mimeType: normalizedMime,
      source: source || "upload",
      createdAt: new Date().toISOString(),
    };

    const updatedSamples = [...profile.samples, sample];
    const totalDuration = updatedSamples.reduce((sum, s) => sum + s.duration, 0);
    await updateProfile(id, { samples: updatedSamples, totalDuration });

    return NextResponse.json(
      { success: true, data: sample, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to add sample" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
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

    const url = new URL(request.url);
    const sampleId = url.searchParams.get("sampleId");

    if (!sampleId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "sampleId is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const sampleIndex = profile.samples.findIndex((s) => s.id === sampleId);
    if (sampleIndex === -1) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Sample not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const updatedSamples = profile.samples.filter((s) => s.id !== sampleId);
    const totalDuration = updatedSamples.reduce((sum, s) => sum + s.duration, 0);
    await updateProfile(id, { samples: updatedSamples, totalDuration });

    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete sample" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
