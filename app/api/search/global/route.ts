import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "5") || 5, 20);
  const type = searchParams.get("type") || "all";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { vehicles: [], parts: [], services: [], totalByType: {}, suggestions: [] },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  const results = await globalSearch(q, { limitPerType: limit, type });

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
