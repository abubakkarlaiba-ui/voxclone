import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { dbExecute } from "@/lib/db";

const MAX_AVATAR_SIZE = 100 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let avatarUrl: string;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      avatarUrl = body.avatarUrl;
      if (!avatarUrl || typeof avatarUrl !== "string") {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Missing avatarUrl" } }, { status: 400 });
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file provided" } }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid file type" } }, { status: 400 });
      }
      if (file.size > MAX_AVATAR_SIZE) {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: `File too large (${Math.round(file.size / 1024)}KB). Max 100KB.` } }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      avatarUrl = `data:${file.type};base64,${btoa(binary)}`;
    } else {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Unsupported content type" } }, { status: 400 });
    }

    console.log(`[Avatar] User: ${session.userId}, Avatar length: ${avatarUrl.length}`);

    await dbExecute("UPDATE users SET avatar_url = $1 WHERE id = $2", [avatarUrl, session.userId]);

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Avatar] Full error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: `Failed to upload avatar: ${message}` } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid session" } }, { status: 401 });
    }

    await dbExecute("UPDATE users SET avatar_url = NULL WHERE id = $1", [session.userId]);

    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to remove avatar" } },
      { status: 500 }
    );
  }
}
