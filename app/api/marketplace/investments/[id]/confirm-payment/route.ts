import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmPaymentSchema } from "@/lib/validators/marketplace";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  PUT /api/marketplace/investments/[id]/confirm-payment               */
/*  Admin potvrdí přijetí platby                                        */
/* ------------------------------------------------------------------ */

export async function PUT(
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

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!investment) {
      return NextResponse.json(
        { error: "Investice nenalezena" },
        { status: 404 }
      );
    }

    if (investment.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Platba již byla zpracována" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = confirmPaymentSchema.parse(body);

    // Reject flow — zamítnutí platby
    if ("rejected" in data && data.rejected === true) {
      const updated = await prisma.investment.update({
        where: { id },
        data: { paymentStatus: "REFUNDED" },
      });
      return NextResponse.json({ investment: updated });
    }

    // Confirm flow — potvrzení platby
    const updated = await prisma.investment.update({
      where: { id },
      data: {
        paymentStatus: "CONFIRMED",
        paymentReference: data.paymentReference,
      },
    });

    // Přepočítat fundedAmount a případně změnit status na FUNDED
    const totalNeeded =
      investment.opportunity.purchasePrice +
      investment.opportunity.repairCost;

    const confirmedInvestments = await prisma.investment.findMany({
      where: {
        opportunityId: investment.opportunityId,
        paymentStatus: "CONFIRMED",
      },
      select: { amount: true },
    });

    const totalFunded = confirmedInvestments.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    const opportunityUpdate: Record<string, unknown> = {
      fundedAmount: totalFunded,
    };

    // Auto-přechod do FUNDED pokud je plně financováno
    if (
      totalFunded >= totalNeeded &&
      investment.opportunity.status === "FUNDING"
    ) {
      opportunityUpdate.status = "FUNDED";
    }

    await prisma.flipOpportunity.update({
      where: { id: investment.opportunityId },
      data: opportunityUpdate,
    });

    return NextResponse.json({ investment: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error(
      "PUT /api/marketplace/investments/[id]/confirm-payment error:",
      error
    );
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
