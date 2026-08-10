import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { UserPublic } from "@/types/user";
import { verifySessionToken, SESSION_COOKIE, hashPassword } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/user-store";

interface UpdateProfileBody {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserPublic>>> {
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
    const { name, email, currentPassword, newPassword } = body as UpdateProfileBody;

    const user = getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const updates: Partial<typeof user> = {};

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Name cannot be empty" }, timestamp: new Date().toISOString() },
          { status: 400 }
        );
      }
      if (trimmed.length > 100) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Name too long" }, timestamp: new Date().toISOString() },
          { status: 400 }
        );
      }
      updates.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid email address" }, timestamp: new Date().toISOString() },
          { status: 400 }
        );
      }
      updates.email = trimmed;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Current password required to set new password" }, timestamp: new Date().toISOString() },
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

      const { verifyPassword } = await import("@/lib/auth");
      const valid = await verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect" }, timestamp: new Date().toISOString() },
          { status: 401 }
        );
      }

      const { hash, salt } = await hashPassword(newPassword);
      updates.passwordHash = hash;
      updates.salt = salt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No updates provided" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const updated = updateUser(session.userId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update profile" }, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    const publicUser: UserPublic = {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      createdAt: updated.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: publicUser,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update profile" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
