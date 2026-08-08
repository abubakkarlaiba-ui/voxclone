import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceProfile, UpdateVoiceProfileRequest } from "@/types";
import { getProfileById, updateProfile, deleteProfile } from "@/lib/voice-store";

export async function GET(
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

    return NextResponse.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
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

    const body = await request.json();
    const { name, description } = body as UpdateVoiceProfileRequest;

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Name cannot be empty" }, timestamp: new Date().toISOString() },
          { status: 400 }
        );
      }
    }

    const updates: Partial<VoiceProfile> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    const updated = updateProfile(id, updates);

    return NextResponse.json({
      success: true,
      data: updated!,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update profile" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    const deleted = deleteProfile(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Voice profile not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete profile" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
