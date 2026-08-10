import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, HistoryItem, HistoryListResult } from "@/types";
import { getHistoryList, addHistoryItem, clearHistory } from "@/lib/history-store";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<HistoryListResult>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const search = searchParams.get("search") || undefined;
    const voiceId = searchParams.get("voiceId") || undefined;

    const result = getHistoryList(user.userId, { page, pageSize, search, voiceId });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message: "Failed to fetch history" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<HistoryItem>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { voiceId, voiceName, text, audioUrl, duration, format, options } = body as Partial<HistoryItem>;

    if (!voiceId || !voiceName || !text || !audioUrl) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "voiceId, voiceName, text, and audioUrl are required" },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (typeof text !== "string" || text.length > 10000) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid text" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (typeof audioUrl !== "string" || !audioUrl.startsWith("data:")) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid audio data" }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      userId: user.userId,
      voiceId,
      voiceName: String(voiceName).slice(0, 100),
      text: text.slice(0, 10000),
      audioUrl,
      duration: typeof duration === "number" ? Math.max(0, Math.min(duration, 600)) : 0,
      format: format ?? "mp3",
      options: options ?? {},
      createdAt: new Date().toISOString(),
    };

    addHistoryItem(item);

    return NextResponse.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to create history item" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    clearHistory(user.userId);
    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "DELETE_ERROR", message: "Failed to clear history" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
