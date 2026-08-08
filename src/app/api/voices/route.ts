import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoiceProfile, CreateVoiceProfileRequest } from "@/types";
import { getAllProfiles, addProfile } from "@/lib/voice-store";

export async function GET(): Promise<NextResponse<ApiResponse<VoiceProfile[]>>> {
  try {
    const profiles = getAllProfiles();
    return NextResponse.json({
      success: true,
      data: profiles,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch profiles" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<VoiceProfile>>> {
  try {
    const body = await request.json();
    const { name, description } = body as CreateVoiceProfileRequest;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Profile name is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name must be 100 characters or less" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const profile: VoiceProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description?.trim() || "",
      status: "draft",
      samples: [],
      totalDuration: 0,
      providerVoiceId: null,
      createdAt: now,
      updatedAt: now,
      processedAt: null,
      errorMessage: null,
    };

    addProfile(profile);

    return NextResponse.json(
      { success: true, data: profile, timestamp: now },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create profile" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
