import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/stats — Statistiky marketplace                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role === "ADMIN" || role === "BACKOFFICE") {
      // Admin vidí celkové statistiky
      const [
        totalOpportunities,
        activeOpportunities,
        completedDeals,
        allInvestments,
        completedOpportunities,
      ] = await Promise.all([
        prisma.flipOpportunity.count(),
        prisma.flipOpportunity.count({
          where: {
            status: {
              in: ["FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE"],
            },
          },
        }),
        prisma.flipOpportunity.count({ where: { status: "COMPLETED" } }),
        prisma.investment.aggregate({
          where: { paymentStatus: "CONFIRMED" },
          _sum: { amount: true },
        }),
        prisma.flipOpportunity.findMany({
          where: { status: "COMPLETED", actualSalePrice: { not: null } },
          select: {
            purchasePrice: true,
            repairCost: true,
            actualSalePrice: true,
          },
        }),
      ]);

      const totalInvested = allInvestments._sum.amount ?? 0;
      const totalProfit = completedOpportunities.reduce((sum, opp) => {
        const profit =
          (opp.actualSalePrice ?? 0) - opp.purchasePrice - opp.repairCost;
        return sum + Math.max(0, profit);
      }, 0);
      const carmaklerRevenue = Math.floor(totalProfit * 0.2);

      return NextResponse.json({
        stats: {
          totalOpportunities,
          activeOpportunities,
          completedDeals,
          totalInvested,
          totalProfit,
          carmaklerRevenue,
        },
      });
    }

    if (role === "VERIFIED_DEALER") {
      // Dealer vidí svoje příležitosti
      const [total, active, completed, myOpportunities] = await Promise.all([
        prisma.flipOpportunity.count({ where: { dealerId: userId } }),
        prisma.flipOpportunity.count({
          where: {
            dealerId: userId,
            status: {
              in: ["FUNDING", "FUNDED", "IN_REPAIR", "FOR_SALE"],
            },
          },
        }),
        prisma.flipOpportunity.count({
          where: { dealerId: userId, status: "COMPLETED" },
        }),
        prisma.flipOpportunity.findMany({
          where: {
            dealerId: userId,
            status: "COMPLETED",
            actualSalePrice: { not: null },
          },
          select: {
            purchasePrice: true,
            repairCost: true,
            actualSalePrice: true,
          },
        }),
      ]);

      const totalEarnings = myOpportunities.reduce((sum, opp) => {
        const profit =
          (opp.actualSalePrice ?? 0) - opp.purchasePrice - opp.repairCost;
        return sum + Math.floor(Math.max(0, profit) * 0.4);
      }, 0);

      return NextResponse.json({
        stats: {
          totalOpportunities: total,
          activeOpportunities: active,
          completedDeals: completed,
          totalEarnings,
        },
      });
    }

    if (role === "INVESTOR") {
      // Investor vidí svoje investice
      const [
        totalInvestments,
        pendingInvestments,
        confirmedInvestments,
        paidOutInvestments,
      ] = await Promise.all([
        prisma.investment.count({ where: { investorId: userId } }),
        prisma.investment.aggregate({
          where: { investorId: userId, paymentStatus: "PENDING" },
          _sum: { amount: true },
        }),
        prisma.investment.aggregate({
          where: { investorId: userId, paymentStatus: "CONFIRMED" },
          _sum: { amount: true },
        }),
        prisma.investment.findMany({
          where: {
            investorId: userId,
            paidOutAt: { not: null },
          },
          select: { amount: true, returnAmount: true },
        }),
      ]);

      const totalInvested = confirmedInvestments._sum.amount ?? 0;
      const totalReturns = paidOutInvestments.reduce(
        (sum, inv) => sum + (inv.returnAmount ?? 0),
        0
      );
      const totalOriginal = paidOutInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const averageROI =
        totalOriginal > 0
          ? ((totalReturns - totalOriginal) / totalOriginal) * 100
          : 0;

      return NextResponse.json({
        stats: {
          totalInvestments,
          totalInvested,
          pendingAmount: pendingInvestments._sum.amount ?? 0,
          totalReturns,
          averageROI: Math.round(averageROI * 100) / 100,
          completedPayouts: paidOutInvestments.length,
        },
      });
    }

    return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
  } catch (error) {
    console.error("GET /api/marketplace/stats error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
