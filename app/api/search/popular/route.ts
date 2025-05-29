import { NextRequest, NextResponse } from "next/server";
import { getPopularSearchesAction } from "@/actions/search-actions";

export async function GET(request: NextRequest) {
  try {
    const result = await getPopularSearchesAction();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Get popular searches API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
} 