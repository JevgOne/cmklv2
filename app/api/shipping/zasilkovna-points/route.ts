import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  GET /api/shipping/zasilkovna-points — proxy pro Zásilkovna feed     */
/*  Primární UI je Packeta.Widget.pick() (client-side). Toto je         */
/*  server-side fallback / search pro backend validaci.                  */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim();
  const limit = Math.min(20, parseInt(params.get("limit") || "10", 10));

  if (!query || query.length < 2) {
    return NextResponse.json({ points: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_ZASILKOVNA_API_KEY;
  if (!apiKey) {
    // Dry-run: mock data
    return NextResponse.json({
      points: [
        {
          id: 12345,
          name: "Zásilkovna - Brno, Joštova 4",
          address: "Joštova 4",
          city: "Brno",
          zip: "60200",
          latitude: 49.1951,
          longitude: 16.6068,
          openingHours: "Po-Pá 8-18, So 9-12",
        },
      ],
    });
  }

  try {
    const res = await fetch(
      `https://www.zasilkovna.cz/api/v4/${apiKey}/branch.json`,
      { next: { revalidate: 86400 } }, // cache 24h
    );

    if (!res.ok) {
      return NextResponse.json({ points: [], error: "Nepodařilo se načíst pobočky" });
    }

    const data = await res.json();
    const normalizedQuery = query.toLowerCase();

    const filtered = (data.data || [])
      .filter(
        (b: Record<string, string>) =>
          b.name?.toLowerCase().includes(normalizedQuery) ||
          b.city?.toLowerCase().includes(normalizedQuery) ||
          b.zip?.includes(normalizedQuery),
      )
      .slice(0, limit)
      .map((b: Record<string, unknown>) => ({
        id: b.id,
        name: b.name,
        address: b.street,
        city: b.city,
        zip: b.zip,
        latitude: b.latitude,
        longitude: b.longitude,
        openingHours:
          (b.openingHours as Record<string, string> | undefined)?.compactShort ?? "",
        photo: (b.photo as Record<string, string> | undefined)?.normal ?? undefined,
      }));

    return NextResponse.json({ points: filtered });
  } catch (error) {
    console.error("Zásilkovna points error:", error);
    return NextResponse.json({ points: [] });
  }
}
