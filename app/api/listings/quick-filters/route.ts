import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QUICK_FILTERS, quickFilterToWhere } from "@/lib/listing-quick-filters";

/* ------------------------------------------------------------------ */
/*  GET /api/listings/quick-filters — Dostupné filtry s počty         */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    // Pro kazdy quick filter spocitat pocet aktivnich inzeratu
    const filtersWithCounts = await Promise.all(
      QUICK_FILTERS.map(async (filter) => {
        const where = {
          status: "ACTIVE",
          ...quickFilterToWhere(filter),
        };

        const count = await prisma.listing.count({ where });

        return {
          label: filter.label,
          slug: filter.slug,
          icon: filter.icon,
          description: filter.description,
          count,
        };
      })
    );

    return NextResponse.json({
      filters: filtersWithCounts,
    });
  } catch (error) {
    console.error("GET /api/listings/quick-filters error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
