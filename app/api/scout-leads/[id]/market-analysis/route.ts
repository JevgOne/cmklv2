import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchMarketData } from "@/lib/market-analysis";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    const lead = await prisma.scoutLead.findUnique({
      where: { id },
      select: {
        id: true,
        category: true,
        vehicleBrand: true,
        vehicleModel: true,
        vehicleYear: true,
        vehiclePrice: true,
        vehicleMileage: true,
        assignedToId: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // RBAC: broker can only access own leads
    if (session.user.role === "BROKER" && lead.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    // Only SOUKROMNIK leads with vehicle data
    if (lead.category !== "SOUKROMNIK" || !lead.vehicleBrand || !lead.vehicleModel) {
      return NextResponse.json({
        priceDistribution: null,
        priceVerdict: null,
        similarOffers: [],
        meta: { fromCache: false, fetchedAt: new Date().toISOString(), dbFallback: false },
      });
    }

    const year = lead.vehicleYear || new Date().getFullYear();
    const leadPrice = lead.vehiclePrice || 0;

    const result = await fetchMarketData(
      lead.id,
      lead.vehicleBrand,
      lead.vehicleModel,
      year,
      leadPrice
    );

    return NextResponse.json({
      priceDistribution:
        result.histogram.length > 0
          ? {
              buckets: result.histogram,
              stats: result.stats,
              sources: result.sources,
            }
          : null,
      priceVerdict:
        result.histogram.length > 0 ? result.verdict : null,
      similarOffers: result.similarOffers.map((s) => ({
        price: s.price,
        year: s.year,
        mileage: s.mileage,
        source: s.source,
        url: s.url,
        title: s.title,
      })),
      meta: {
        fromCache: result.fromCache,
        fetchedAt: result.fetchedAt,
        dbFallback: result.dbFallback,
      },
    });
  } catch (error) {
    console.error("GET /api/scout-leads/[id]/market-analysis error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
