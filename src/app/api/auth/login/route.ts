import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { UserPublic } from "@/types/user";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/user-store";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 10 };

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again later." }, timestamp: new Date().toISOString() },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

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
