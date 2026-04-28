import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respondNegotiationSchema } from "@/lib/validators/marketplace";
import { notifyMarketplace } from "@/lib/marketplace/notifications";
import {
  marketplaceNegotiationSubject,
  marketplaceNegotiationHtml,
  marketplaceNegotiationText,
} from "@/lib/email-templates/marketplace-negotiation";

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/negotiations/[id]/respond                    */
/*  Investor přijme / odmítne / pošle protinabídku                     */
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

    const { id } = await params;

    const negotiation = await prisma.dealNegotiation.findUnique({
      where: { id },
      include: {
        opportunity: { select: { id: true, dealerId: true, status: true, brand: true, model: true, year: true } },
      },
    });

    if (!negotiation) {
      return NextResponse.json(
        { error: "Nabídka nenalezena" },
        { status: 404 }
      );
    }

    if (negotiation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Na tuto nabídku již bylo odpovězeno" },
        { status: 400 }
      );
    }

    // Jen adresát (toUser) smí odpovědět
    if (negotiation.toUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nemáte oprávnění odpovědět na tuto nabídku" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = respondNegotiationSchema.parse(body);

    if (data.action === "ACCEPT") {
      // Přijmout nabídku → zapsat dohodnutý split do FlipOpportunity
      await prisma.$transaction([
        prisma.dealNegotiation.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        }),
        prisma.flipOpportunity.update({
          where: { id: negotiation.opportunityId },
          data: {
            agreedDealerSharePct: negotiation.dealerSharePct,
            agreedInvestorSharePct: negotiation.investorSharePct,
          },
        }),
      ]);

      // Notify the other party about acceptance
      const opp = negotiation.opportunity;
      const carTitle = `${opp.brand} ${opp.model} ${opp.year}`;
      const link = `/marketplace/deals/${opp.id}`;
      const baseEmailData = {
        dealerName: session.user.firstName ?? "Strana",
        carTitle,
        dealerSharePct: negotiation.dealerSharePct,
        investorSharePct: negotiation.investorSharePct,
        action: "ACCEPTED" as const,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${link}`,
      };
      notifyMarketplace({
        type: "NEGOTIATION",
        opportunityId: opp.id,
        recipientIds: [negotiation.fromUserId],
        title: "Nabídka přijata!",
        body: `${carTitle} — ${negotiation.dealerSharePct}/${negotiation.investorSharePct}`,
        link,
        email: (recipientName) => {
          const emailData = { ...baseEmailData, recipientName };
          return {
            subject: marketplaceNegotiationSubject(emailData),
            html: marketplaceNegotiationHtml(emailData),
            text: marketplaceNegotiationText(emailData),
          };
        },
      }).catch(() => {});

      return NextResponse.json({
        negotiation: { ...negotiation, status: "ACCEPTED" },
        message: "Nabídka přijata — podíly zapsány",
      });
    }

    if (data.action === "REJECT") {
      await prisma.dealNegotiation.update({
        where: { id },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
        },
      });

      // Notify sender about rejection
      const oppR = negotiation.opportunity;
      const carTitleR = `${oppR.brand} ${oppR.model} ${oppR.year}`;
      const linkR = `/marketplace/deals/${oppR.id}`;
      const baseEmailDataR = {
        dealerName: session.user.firstName ?? "Strana",
        carTitle: carTitleR,
        dealerSharePct: negotiation.dealerSharePct,
        investorSharePct: negotiation.investorSharePct,
        action: "REJECTED" as const,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${linkR}`,
      };
      notifyMarketplace({
        type: "NEGOTIATION",
        opportunityId: oppR.id,
        recipientIds: [negotiation.fromUserId],
        title: "Nabídka zamítnuta",
        body: carTitleR,
        link: linkR,
        email: (recipientName) => {
          const emailDataR = { ...baseEmailDataR, recipientName };
          return {
            subject: marketplaceNegotiationSubject(emailDataR),
            html: marketplaceNegotiationHtml(emailDataR),
            text: marketplaceNegotiationText(emailDataR),
          };
        },
      }).catch(() => {});

      return NextResponse.json({
        negotiation: { ...negotiation, status: "REJECTED" },
        message: "Nabídka zamítnuta",
      });
    }

    // COUNTER — protinabídka
    const counterDealerPct = data.dealerSharePct!;
    const counterInvestorPct = 100 - counterDealerPct;

    // Determine who gets the counter-offer (flip from/to)
    const counterToUserId = negotiation.fromUserId; // zpět odesílateli
    const counterFromRole = negotiation.fromRole === "VERIFIED_DEALER" ? "INVESTOR" : "VERIFIED_DEALER";

    const [, counterOffer] = await prisma.$transaction([
      // Označit původní jako SUPERSEDED
      prisma.dealNegotiation.update({
        where: { id },
        data: {
          status: "SUPERSEDED",
          respondedAt: new Date(),
        },
      }),
      // Vytvořit protinabídku
      prisma.dealNegotiation.create({
        data: {
          opportunityId: negotiation.opportunityId,
          fromUserId: session.user.id,
          fromRole: counterFromRole,
          toUserId: counterToUserId,
          dealerSharePct: counterDealerPct,
          investorSharePct: counterInvestorPct,
          message: data.message ?? null,
          round: negotiation.round + 1,
          status: "PENDING",
        },
      }),
    ]);

    // Notify recipient about counter-offer
    const oppC = negotiation.opportunity;
    const carTitleC = `${oppC.brand} ${oppC.model} ${oppC.year}`;
    const linkC = `/marketplace/deals/${oppC.id}`;
    const baseEmailDataC = {
      dealerName: session.user.firstName ?? "Strana",
      carTitle: carTitleC,
      dealerSharePct: counterDealerPct,
      investorSharePct: counterInvestorPct,
      action: "COUNTER" as const,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${linkC}`,
    };
    notifyMarketplace({
      type: "NEGOTIATION",
      opportunityId: oppC.id,
      recipientIds: [counterToUserId],
      title: "Protinabídka na rozdělení zisku",
      body: `${carTitleC} — ${counterDealerPct}/${counterInvestorPct}`,
      link: linkC,
      email: (recipientName) => {
        const emailDataC = { ...baseEmailDataC, recipientName };
        return {
          subject: marketplaceNegotiationSubject(emailDataC),
          html: marketplaceNegotiationHtml(emailDataC),
          text: marketplaceNegotiationText(emailDataC),
        };
      },
    }).catch(() => {});

    return NextResponse.json({
      negotiation: counterOffer,
      message: "Protinabídka odeslána",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/negotiations/[id]/respond error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
