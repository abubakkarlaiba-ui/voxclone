import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { deleteHistoryItem } from "@/lib/history-store";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    const deleted = deleteHistoryItem(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "History item not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "DELETE_ERROR", message: error instanceof Error ? error.message : "Failed to delete history item" },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
