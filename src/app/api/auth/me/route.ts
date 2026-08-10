import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { UserPublic } from "@/types/user";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getUserById } from "@/lib/user-store";

export async function GET(
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

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const publicUser: UserPublic = { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt };

    return NextResponse.json({
      success: true,
      data: publicUser,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get user" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
