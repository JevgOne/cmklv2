import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNegotiationSchema } from "@/lib/validators/marketplace";
import { notifyMarketplace } from "@/lib/marketplace/notifications";
import {
  marketplaceNegotiationSubject,
  marketplaceNegotiationHtml,
  marketplaceNegotiationText,
} from "@/lib/email-templates/marketplace-negotiation";

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/negotiations — Dealer vytvoří nabídku        */
/*  Round 1 = JEN VERIFIED_DEALER. Další kola řeší respond endpoint.   */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    // Round 1: jen dealer smí vytvořit nabídku
    if (session.user.role !== "VERIFIED_DEALER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Pouze dealer může vytvořit první nabídku" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createNegotiationSchema.parse(body);

    // Ověřit, že příležitost existuje a patří tomuto dealerovi
    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id: data.opportunityId },
      select: { id: true, dealerId: true, brand: true, model: true, year: true },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    if (opportunity.dealerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Můžete vytvořit nabídku jen pro svou příležitost" },
        { status: 403 }
      );
    }

    // Ověřit, že investor existuje a má roli INVESTOR
    const investor = await prisma.user.findUnique({
      where: { id: data.investorId },
      select: { id: true, role: true },
    });

    if (!investor || investor.role !== "INVESTOR") {
      return NextResponse.json(
        { error: "Investor nenalezen nebo nemá roli INVESTOR" },
        { status: 400 }
      );
    }

    // Zrušit předchozí PENDING nabídky pro stejnou příležitost + investora
    await prisma.dealNegotiation.updateMany({
      where: {
        opportunityId: data.opportunityId,
        toUserId: data.investorId,
        status: "PENDING",
      },
      data: { status: "SUPERSEDED" },
    });

    const investorSharePct = 100 - data.dealerSharePct;

    const negotiation = await prisma.dealNegotiation.create({
      data: {
        opportunityId: data.opportunityId,
        fromUserId: session.user.id,
        fromRole: "VERIFIED_DEALER",
        toUserId: data.investorId,
        dealerSharePct: data.dealerSharePct,
        investorSharePct,
        message: data.message ?? null,
        round: 1,
        status: "PENDING",
      },
    });

    // Notify investor about new offer (fire-and-forget)
    const carTitle = `${opportunity.brand} ${opportunity.model} ${opportunity.year}`;
    const link = `/marketplace/deals/${opportunity.id}`;
    const emailData = {
      recipientName: "", // will be filled by notification system
      dealerName: session.user.firstName ?? "Realizátor",
      carTitle,
      dealerSharePct: data.dealerSharePct,
      investorSharePct: investorSharePct,
      message: data.message,
      action: "NEW_OFFER" as const,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz"}${link}`,
    };
    notifyMarketplace({
      type: "NEGOTIATION",
      opportunityId: opportunity.id,
      recipientIds: [data.investorId],
      title: "Nová nabídka na rozdělení zisku",
      body: `${carTitle} — ${data.dealerSharePct}/${investorSharePct}`,
      link,
      email: {
        subject: marketplaceNegotiationSubject(emailData),
        html: marketplaceNegotiationHtml(emailData),
        text: marketplaceNegotiationText(emailData),
      },
    }).catch(() => {});

    return NextResponse.json({ negotiation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/negotiations error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/negotiations — Seznam vyjednávání             */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const opportunityId = params.get("opportunityId");

    const where: Record<string, unknown> = {};

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    // Dealer vidí nabídky ze svých příležitostí, investor vidí nabídky adresované jemu
    if (session.user.role === "VERIFIED_DEALER") {
      where.opportunity = { dealerId: session.user.id };
    } else if (session.user.role === "INVESTOR") {
      where.OR = [
        { toUserId: session.user.id },
        { fromUserId: session.user.id },
      ];
    }
    // ADMIN/BACKOFFICE vidí vše

    const negotiations = await prisma.dealNegotiation.findMany({
      where,
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true } },
        toUser: { select: { id: true, firstName: true, lastName: true } },
        opportunity: {
          select: { id: true, brand: true, model: true, year: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ negotiations });
  } catch (error) {
    console.error("GET /api/marketplace/negotiations error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
