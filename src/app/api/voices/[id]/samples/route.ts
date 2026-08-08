import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceSample, AddSampleRequest } from "@/types";
import { getProfileById } from "@/lib/voice-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<VoiceSample[]>>> {
  try {
    const { id } = await params;
    const profile = getProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
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
    const { id } = await params;
    const profile = getProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { filename, size, mimeType, duration, source } = body as AddSampleRequest;

    if (!filename || !mimeType || typeof duration !== "number" || duration <= 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid sample data" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const sample: VoiceSample = {
      id: crypto.randomUUID(),
      filename,
      url: "",
      blob: null,
      duration,
      size: size || 0,
      mimeType,
      source: source || "upload",
      createdAt: new Date().toISOString(),
    };

    profile.samples.push(sample);
    profile.totalDuration = profile.samples.reduce((sum, s) => sum + s.duration, 0);
    profile.updatedAt = new Date().toISOString();

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
    const { id } = await params;
    const profile = getProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
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

    profile.samples.splice(sampleIndex, 1);
    profile.totalDuration = profile.samples.reduce((sum, s) => sum + s.duration, 0);
    profile.updatedAt = new Date().toISOString();

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
