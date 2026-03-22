import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payoutSchema } from "@/lib/validators/marketplace";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/opportunities/[id]/payout                    */
/*  Admin provede výplatu — logika 40/40/20                            */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
      include: {
        investments: {
          where: { paymentStatus: "CONFIRMED" },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    if (opportunity.status !== "SOLD" && opportunity.status !== "PAYOUT_PENDING") {
      return NextResponse.json(
        { error: "Příležitost musí být ve stavu SOLD nebo PAYOUT_PENDING" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = payoutSchema.parse(body);

    const actualSalePrice = data.actualSalePrice;
    const actualProfit =
      actualSalePrice - opportunity.purchasePrice - opportunity.repairCost;

    if (actualProfit <= 0) {
      // Při ztrátě investoři dostanou zpět svůj vklad (bez zisku)
      const now = new Date();
      await prisma.$transaction([
        // Aktualizovat příležitost
        prisma.flipOpportunity.update({
          where: { id },
          data: {
            actualSalePrice,
            soldAt: opportunity.soldAt ?? now,
            status: "COMPLETED",
          },
        }),
        // Vrátit investorům vklad
        ...opportunity.investments.map((inv) =>
          prisma.investment.update({
            where: { id: inv.id },
            data: {
              returnAmount: inv.amount,
              paidOutAt: now,
            },
          })
        ),
      ]);

      return NextResponse.json({
        payout: {
          actualProfit,
          investorShare: 0,
          dealerShare: 0,
          carmaklerShare: 0,
          note: "Prodej bez zisku — investorům vrácen vklad",
          investments: opportunity.investments.map((inv) => ({
            investmentId: inv.id,
            investorId: inv.investorId,
            investedAmount: inv.amount,
            returnAmount: inv.amount,
          })),
        },
      });
    }

    // Výpočet podílů: 40% investoři, 40% dealer, 20% Carmakler
    const investorShare = Math.floor(actualProfit * 0.4);
    const dealerShare = Math.floor(actualProfit * 0.4);
    const carmaklerShare = actualProfit - investorShare - dealerShare;

    // Rozdělit investorský podíl poměrně
    const totalInvested = opportunity.investments.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    const investmentPayouts = opportunity.investments.map((inv) => {
      const ratio = totalInvested > 0 ? inv.amount / totalInvested : 0;
      const profit = Math.floor(investorShare * ratio);
      return {
        investmentId: inv.id,
        investorId: inv.investorId,
        investedAmount: inv.amount,
        returnAmount: inv.amount + profit, // vklad + podíl na zisku
      };
    });

    const now = new Date();

    await prisma.$transaction([
      // Aktualizovat příležitost
      prisma.flipOpportunity.update({
        where: { id },
        data: {
          actualSalePrice,
          soldAt: opportunity.soldAt ?? now,
          status: "COMPLETED",
        },
      }),
      // Vyplatit investory
      ...investmentPayouts.map((payout) =>
        prisma.investment.update({
          where: { id: payout.investmentId },
          data: {
            returnAmount: payout.returnAmount,
            paidOutAt: now,
          },
        })
      ),
    ]);

    return NextResponse.json({
      payout: {
        actualProfit,
        investorShare,
        dealerShare,
        carmaklerShare,
        investments: investmentPayouts,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error(
      "POST /api/marketplace/opportunities/[id]/payout error:",
      error
    );
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
