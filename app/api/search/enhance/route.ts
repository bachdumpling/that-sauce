import { NextRequest, NextResponse } from "next/server";
import { enhanceSearchPromptAction } from "@/actions/search-actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query field is required" },
        { status: 400 }
      );
    }

    const result = await enhanceSearchPromptAction(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Enhance search API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
} 