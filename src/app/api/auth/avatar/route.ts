import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { dbExecute } from "@/lib/db";

const MAX_AVATAR_SIZE = 200 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ avatarUrl: string }>>> {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No file provided" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "File too large. Maximum 200KB. Please compress your image first." }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const avatarUrl = `data:${file.type};base64,${base64}`;

    console.log(`[Avatar] User: ${session.userId}, File size: ${file.size}, Base64 length: ${avatarUrl.length}`);

    try {
      await dbExecute("UPDATE users SET avatar_url = $1 WHERE id = $2", [avatarUrl, session.userId]);
      console.log("[Avatar] DB update successful");
    } catch (dbErr) {
      console.error("[Avatar] DB update failed:", dbErr);
      throw dbErr;
    }

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to upload avatar" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    await dbExecute("UPDATE users SET avatar_url = NULL WHERE id = $1", [session.userId]);

    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to remove avatar" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
