import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  const response = NextResponse.json({
    success: true,
    data: null,
    timestamp: new Date().toISOString(),
  });

  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
