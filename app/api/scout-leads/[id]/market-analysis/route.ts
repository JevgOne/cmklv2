import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calculatePercentile(values: number[], value: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return Math.round((below / sorted.length) * 100);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
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
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Only SOUKROMNIK leads have vehicle data for market analysis
    if (lead.category !== "SOUKROMNIK" || !lead.vehicleBrand || !lead.vehicleModel) {
      return NextResponse.json({
        priceDistribution: null,
        priceVerdict: null,
        similarLeads: [],
      });
    }

    // Query similar leads: same brand + model, ±2 years
    const yearMin = lead.vehicleYear ? lead.vehicleYear - 2 : undefined;
    const yearMax = lead.vehicleYear ? lead.vehicleYear + 2 : undefined;

    const similar = await prisma.scoutLead.findMany({
      where: {
        vehicleBrand: lead.vehicleBrand,
        vehicleModel: lead.vehicleModel,
        ...(yearMin && yearMax
          ? { vehicleYear: { gte: yearMin, lte: yearMax } }
          : {}),
        ...(lead.vehicleMileage
          ? { vehicleMileage: { gte: lead.vehicleMileage - 50000, lte: lead.vehicleMileage + 50000 } }
          : {}),
        vehiclePrice: { not: null, gt: 0 },
        id: { not: lead.id },
      },
      select: {
        id: true,
        vehiclePrice: true,
        vehicleYear: true,
        vehicleMileage: true,
        city: true,
        source: true,
        sourceUrl: true,
        listingTitle: true,
      },
      take: 1000,
    });

    const prices = similar
      .map((s) => s.vehiclePrice!)
      .filter((p) => p > 0);

    // Price distribution (need >= 5 data points)
    let priceDistribution = null;
    let priceVerdict = null;

    if (prices.length >= 5 && lead.vehiclePrice && lead.vehiclePrice > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min;
      const bucketCount = Math.min(12, Math.max(8, Math.ceil(prices.length / 5)));
      const bucketSize = Math.ceil(range / bucketCount) || 1;

      const buckets: Array<{
        min: number;
        max: number;
        count: number;
        isCurrent: boolean;
      }> = [];

      for (let i = 0; i < bucketCount; i++) {
        const bMin = min + i * bucketSize;
        const bMax = i === bucketCount - 1 ? max + 1 : min + (i + 1) * bucketSize;
        const count = prices.filter((p) => p >= bMin && p < bMax).length;
        const isCurrent =
          lead.vehiclePrice >= bMin && lead.vehiclePrice < bMax;
        buckets.push({ min: bMin, max: bMax, count, isCurrent });
      }

      const median = calculateMedian(prices);
      const mean = Math.round(
        prices.reduce((sum, p) => sum + p, 0) / prices.length
      );
      const percentile = calculatePercentile(prices, lead.vehiclePrice);

      priceDistribution = {
        buckets,
        stats: {
          median,
          mean,
          min,
          max,
          count: prices.length,
          percentile,
        },
      };

      // Price verdict
      const deviation = ((lead.vehiclePrice - median) / median) * 100;
      let verdict: "LOW" | "OK" | "HIGH";
      let label: string;
      if (deviation < -15) {
        verdict = "LOW";
        label = `Pod průměrem (${Math.round(deviation)}%)`;
      } else if (deviation > 15) {
        verdict = "HIGH";
        label = `Nad průměrem (+${Math.round(deviation)}%)`;
      } else {
        verdict = "OK";
        label = "V normálu";
      }
      priceVerdict = { verdict, deviationPercent: Math.round(deviation), label };
    }

    // Similar leads — 5 closest by price
    let similarLeads: typeof similar = [];
    if (lead.vehiclePrice && lead.vehiclePrice > 0) {
      similarLeads = [...similar]
        .filter((s) => s.vehiclePrice && s.vehiclePrice > 0)
        .sort(
          (a, b) =>
            Math.abs(a.vehiclePrice! - lead.vehiclePrice!) -
            Math.abs(b.vehiclePrice! - lead.vehiclePrice!)
        )
        .slice(0, 5);
    } else {
      similarLeads = similar.slice(0, 5);
    }

    return NextResponse.json({
      priceDistribution,
      priceVerdict,
      similarLeads: similarLeads.map((s) => ({
        id: s.id,
        listingTitle: s.listingTitle,
        vehicleYear: s.vehicleYear,
        vehiclePrice: s.vehiclePrice,
        vehicleMileage: s.vehicleMileage,
        city: s.city,
        source: s.source,
        sourceUrl: s.sourceUrl,
      })),
    });
  } catch (error) {
    console.error("GET /api/scout-leads/[id]/market-analysis error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
