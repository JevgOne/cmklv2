import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSkillTagCounts } from "@/lib/reputation/skill-tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const [trustScore, badges, user] = await Promise.all([
      prisma.trustScore.findUnique({ where: { userId } }),
      prisma.autoBadge.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        select: { badge: true, context: true, unlockedAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
    }

    // Determine context from role
    const contextMap: Record<string, string> = {
      BROKER: "BROKER",
      MANAGER: "BROKER",
      REGIONAL_DIRECTOR: "BROKER",
      PARTS_SUPPLIER: "SUPPLIER",
      VERIFIED_DEALER: "DEALER",
      INVESTOR: "INVESTOR",
      ADVERTISER: "SELLER",
    };
    const context = contextMap[user.role] ?? "BROKER";

    const skillTags = await getSkillTagCounts(userId, context);

    return NextResponse.json({
      score: trustScore?.score ?? 0,
      tier: trustScore?.tier ?? "NEW",
      avgResponseMinutes: trustScore?.avgResponseMinutes ?? null,
      responseRate: trustScore?.responseRate ?? null,
      lastActiveAt: trustScore?.lastActiveAt ?? null,
      badges,
      skillTags,
      context,
    });
  } catch (error) {
    console.error("GET /api/reputation/[userId]/score error:", error);
    return NextResponse.json({ error: "Interní chyba" }, { status: 500 });
  }
}
