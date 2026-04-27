import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payoutSchema } from "@/lib/validators/marketplace";
import { calculateDealerRating } from "@/lib/marketplace/dealer-rating";
import { notifyMarketplace } from "@/lib/marketplace/notifications";
import {
  marketplacePayoutSubject,
  marketplacePayoutHtml,
  marketplacePayoutText,
} from "@/lib/email-templates/marketplace-payout";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/opportunities/[id]/payout                    */
/*  Admin provede výplatu — 5% CarMakléř fee + dohodnutý split         */
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
    // Helper for car title (used in notifications below)
    const carTitle = opportunity ? `${opportunity.brand} ${opportunity.model} ${opportunity.year}` : "";
    const dealLink = `/marketplace/deals/${id}`;

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

      // Recalculate dealer rating after completed flip (fire-and-forget)
      calculateDealerRating(opportunity.dealerId).catch(() => {});

      // Notify investors about payout (fire-and-forget)
      for (const inv of opportunity.investments) {
        const emailData = {
          recipientName: "",
          carTitle,
          investedAmount: inv.amount,
          returnAmount: inv.amount,
          profit: 0,
          roi: 0,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${dealLink}`,
        };
        notifyMarketplace({
          type: "PAYOUT",
          opportunityId: id,
          recipientIds: [inv.investorId],
          title: "Vyúčtování investice",
          body: `${carTitle} — vklad vrácen`,
          link: dealLink,
          email: {
            subject: marketplacePayoutSubject(emailData),
            html: marketplacePayoutHtml(emailData),
            text: marketplacePayoutText(emailData),
          },
        }).catch(() => {});
      }

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

    // Nový provizní model:
    // 1) CarMakléř fee = carmaklerFeePct % z prodejní ceny (default 5%)
    // 2) Zbytek zisku se dělí podle dohodnutého split (agreedDealerSharePct / agreedInvestorSharePct)
    //    Pokud split není dohodnutý, fallback na 50/50
    const carmaklerFeePct = opportunity.carmaklerFeePct ?? 5;
    const carmaklerShare = Math.floor(actualSalePrice * (carmaklerFeePct / 100));
    const distributableProfit = actualProfit - carmaklerShare;

    const dealerPct = opportunity.agreedDealerSharePct ?? 50;
    const investorPct = opportunity.agreedInvestorSharePct ?? 50;
    const totalPct = dealerPct + investorPct || 100;

    const dealerShare = distributableProfit > 0
      ? Math.floor(distributableProfit * (dealerPct / totalPct))
      : 0;
    const investorShare = distributableProfit > 0
      ? distributableProfit - dealerShare
      : 0;

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

    // Recalculate dealer rating after completed flip (fire-and-forget)
    calculateDealerRating(opportunity.dealerId).catch(() => {});

    // Notify each investor about their payout (fire-and-forget)
    for (const payout of investmentPayouts) {
      const profit = payout.returnAmount - payout.investedAmount;
      const roi = payout.investedAmount > 0
        ? Math.round((profit / payout.investedAmount) * 1000) / 10
        : 0;
      const emailData = {
        recipientName: "",
        carTitle,
        investedAmount: payout.investedAmount,
        returnAmount: payout.returnAmount,
        profit,
        roi,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${dealLink}`,
      };
      notifyMarketplace({
        type: "PAYOUT",
        opportunityId: id,
        recipientIds: [payout.investorId],
        title: "Výplata zisku",
        body: `${carTitle} — +${roi}% ROI`,
        link: dealLink,
        email: {
          subject: marketplacePayoutSubject(emailData),
          html: marketplacePayoutHtml(emailData),
          text: marketplacePayoutText(emailData),
        },
      }).catch(() => {});
    }

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
