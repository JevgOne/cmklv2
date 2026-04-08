import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canViewSummary(role: string | undefined): boolean {
  return role === "ADMIN" || role === "BACKOFFICE";
}

// Buckety pro distribuci sazeb. Hranice `max` jsou exkluzivní; poslední bucket
// chytá vše ≥ posledního `max`. Změna hranic = update na jednom místě.
const BUCKETS = [
  { key: "12.00-14.99", max: 15 },
  { key: "15.00-15.99", max: 16 },
  { key: "16.00-17.99", max: 18 },
  { key: "18.00-20.00", max: Infinity },
] as const;

type BucketKey = (typeof BUCKETS)[number]["key"];

/**
 * Začátek aktuálního kalendářního roku v Europe/Prague timezone.
 * 1. leden 00:00 je vždy v zimním čase (CET = UTC+1) — DST přepíná až v březnu —
 * takže výsledek je vždy `${year}-01-01T00:00:00+01:00`.
 */
function startOfYearInPrague(): Date {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
  }).formatToParts(new Date());
  const year = nowParts.find((p) => p.type === "year")?.value ?? "2026";
  return new Date(`${year}-01-01T00:00:00+01:00`);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canViewSummary(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const yearStart = startOfYearInPrague();

    const [activePartners, y2dAggregate] = await Promise.all([
      prisma.partner.findMany({
        where: { status: "AKTIVNI_PARTNER" },
        select: { commissionRate: true },
      }),
      prisma.orderItem.aggregate({
        where: {
          createdAt: { gte: yearStart },
          order: { paymentStatus: "PAID" },
        },
        _sum: {
          totalPrice: true,
          carmaklerFee: true,
        },
      }),
    ]);

    const totalPartners = activePartners.length;

    const distribution: Record<BucketKey, number> = {
      "12.00-14.99": 0,
      "15.00-15.99": 0,
      "16.00-17.99": 0,
      "18.00-20.00": 0,
    };

    let avgCommissionRate = 0;
    if (totalPartners > 0) {
      let sum = 0;
      for (const p of activePartners) {
        const rate = Number(p.commissionRate);
        sum += rate;
        const bucket = BUCKETS.find((b) => rate < b.max) ?? BUCKETS[BUCKETS.length - 1];
        distribution[bucket.key] += 1;
      }
      avgCommissionRate = Math.round((sum / totalPartners) * 100) / 100;
    }

    return NextResponse.json({
      totalPartners,
      avgCommissionRate,
      rateDistribution: distribution,
      totalRevenueY2D: y2dAggregate._sum.totalPrice ?? 0,
      carmaklerFeesY2D: y2dAggregate._sum.carmaklerFee ?? 0,
      yearStartIso: yearStart.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/reports/commission-summary error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
