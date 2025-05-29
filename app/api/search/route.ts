import { NextRequest, NextResponse } from "next/server";
import { searchAction } from "@/actions/search-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const contentType = searchParams.get("contentType") || "all";
    const limit = Number(searchParams.get("limit")) || 10;
    const page = Number(searchParams.get("page")) || 1;
    const role = searchParams.get("role");
    const subjects = searchParams.get("subjects")?.split(",") || [];
    const styles = searchParams.get("styles")?.split(",") || [];
    const maxBudget = searchParams.get("maxBudget")
      ? Number(searchParams.get("maxBudget"))
      : undefined;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const filters = {
      contentType,
      limit,
      page,
      role,
      subjects: subjects.length > 0 ? subjects : undefined,
      styles: styles.length > 0 ? styles : undefined,
      maxBudget,
    };

    const result = await searchAction(query, filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q: query, ...filters } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query field 'q' is required" },
        { status: 400 }
      );
    }

    const result = await searchAction(query, filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
