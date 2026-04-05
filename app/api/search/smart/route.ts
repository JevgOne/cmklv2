import { NextRequest, NextResponse } from "next/server";
import { smartSearch, getSearchSuggestions } from "@/lib/search";

/* ------------------------------------------------------------------ */
/*  GET /api/search/smart — Fulltext search + autocomplete              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim() ?? "";
    const suggestionsOnly = params.get("suggestions") === "true";
    const type = params.get("type") ?? undefined;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));
    const offset = (page - 1) * limit;

    if (query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        suggestions: [],
        page: 1,
        totalPages: 0,
      });
    }

    // Suggestions-only mode (for autocomplete)
    if (suggestionsOnly) {
      const suggestions = await getSearchSuggestions(query);
      return NextResponse.json({ suggestions });
    }

    // Full search
    const data = await smartSearch(query, { limit, offset, type });

    return NextResponse.json({
      ...data,
      page,
      totalPages: Math.ceil(data.total / limit),
    });
  } catch (error) {
    console.error("GET /api/search/smart error:", error);
    return NextResponse.json(
      { error: "Chyba vyhledávání" },
      { status: 500 }
    );
  }
}
