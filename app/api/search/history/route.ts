import { NextRequest, NextResponse } from "next/server";
import {
  getSearchHistoryAction,
  deleteSearchHistoryEntryAction,
  clearSearchHistoryAction,
} from "@/actions/search-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 10;
    const page = Number(searchParams.get("page")) || 1;

    const result = await getSearchHistoryAction(limit, page);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Get search history API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (entryId) {
      // Delete specific entry
      const result = await deleteSearchHistoryEntryAction(entryId);
      return NextResponse.json(result);
    } else {
      // Clear all history
      const result = await clearSearchHistoryAction();
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("Delete search history API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
} 