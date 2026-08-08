import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { UserPublic } from "@/types/user";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/user-store";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Password is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const userPublic: UserPublic = { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
    const token = await createSessionToken(userPublic);

    const response = NextResponse.json({
      success: true,
      data: userPublic,
      timestamp: new Date().toISOString(),
    });

    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to sign in" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
