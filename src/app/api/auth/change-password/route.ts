import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { verifySessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/user-store";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
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

    const body = await request.json();
    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Current and new passwords are required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "New password must be at least 8 characters" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "New password must be 128 characters or less" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const user = getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const { verifyPassword } = await import("@/lib/auth");
    const valid = await verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const { hash, salt } = await hashPassword(newPassword);
    updateUser(session.userId, { passwordHash: hash, salt });

    return NextResponse.json({
      success: true,
      data: { message: "Password updated successfully" },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to change password" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
