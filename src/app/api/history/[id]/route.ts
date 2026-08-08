import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { deleteHistoryItem, getHistoryItemById } from "@/lib/history-store";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const { id } = await params;
    const item = getHistoryItemById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "History item not found" }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    if (item.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access denied" }, timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

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
