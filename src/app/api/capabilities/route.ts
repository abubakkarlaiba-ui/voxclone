import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import type { ProviderCapabilities } from "@/lib/voice-provider/types";
import { getVoiceProvider } from "@/lib/voice-provider";

export async function GET(): Promise<NextResponse<ApiResponse<ProviderCapabilities>>> {
  try {
    const provider = getVoiceProvider();
    const capabilities = provider.getCapabilities();

    return NextResponse.json({
      success: true,
      data: capabilities,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch provider capabilities" }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
