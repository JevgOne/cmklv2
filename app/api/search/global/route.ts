import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // STOP-6: Rate limit 30 req/min per IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 30, 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkuste to za chvíli." },
      { status: 429 }
    );
  }

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
