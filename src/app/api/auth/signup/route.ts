import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { UserPublic } from "@/types/user";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { getUserByEmail, addUser } from "@/lib/user-store";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UserPublic>>> {
  try {
    const body = await request.json();
    const { email, name, password } = body as { email?: string; name?: string; password?: string };

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Valid email is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Name is required" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "An account with this email already exists" }, timestamp: new Date().toISOString() },
        { status: 409 }
      );
    }

    const { hash, salt } = await hashPassword(password);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    addUser({
      id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash: hash,
      salt,
      createdAt: now,
    });

    const userPublic: UserPublic = { id, email: email.toLowerCase().trim(), name: name.trim(), createdAt: now };
    const token = await createSessionToken(userPublic);

    const response = NextResponse.json({
      success: true,
      data: userPublic,
      timestamp: now,
    }, { status: 201 });

    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create account" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
