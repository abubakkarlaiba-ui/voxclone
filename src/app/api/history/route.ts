import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, HistoryItem, HistoryListResult } from "@/types";
import { getHistoryList, addHistoryItem, clearHistory } from "@/lib/history-store";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<HistoryListResult>>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const search = searchParams.get("search") || undefined;
    const voiceId = searchParams.get("voiceId") || undefined;

    const result = getHistoryList({ page, pageSize, search, voiceId });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FETCH_ERROR", message: error instanceof Error ? error.message : "Failed to fetch history" },
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

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      voiceId,
      voiceName,
      text,
      audioUrl,
      duration: duration ?? 0,
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "CREATE_ERROR", message: error instanceof Error ? error.message : "Failed to create history item" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse<null>>> {
  try {
    clearHistory();
    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "DELETE_ERROR", message: error instanceof Error ? error.message : "Failed to clear history" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
