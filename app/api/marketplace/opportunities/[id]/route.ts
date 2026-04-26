import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOpportunitySchema } from "@/lib/validators/marketplace";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/opportunities/[id] — Detail příležitosti      */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    // Marketplace role allow-list — BROKER/BUYER/ADVERTISER/PARTS_SUPPLIER atd. nemají přístup
    const MARKETPLACE_ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"] as const;
    if (!MARKETPLACE_ALLOWED_ROLES.includes(session.user.role as typeof MARKETPLACE_ALLOWED_ROLES[number])) {
      return NextResponse.json(
        { error: "Nemáte oprávnění k zobrazení marketplace příležitostí" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
      include: {
        dealer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            email: true,
          },
        },
        investments: {
          include: {
            investor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    // Dealer vidí jen svoje, investor vidí schválené+, admin vidí vše
    if (
      session.user.role === "VERIFIED_DEALER" &&
      opportunity.dealerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (
      session.user.role === "INVESTOR" &&
      opportunity.status === "PENDING_APPROVAL"
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Investor nevidí detaily investic ostatních investorů
    const investments =
      session.user.role === "INVESTOR"
        ? opportunity.investments.filter(
            (inv) => inv.investorId === session.user.id
          )
        : opportunity.investments;

    // Email dealera viditelný pouze pro ADMIN/BACKOFFICE
    const isAdmin = ADMIN_ROLES.includes(session.user.role);
    const dealerData = {
      ...opportunity.dealer,
      email: isAdmin ? opportunity.dealer.email : undefined,
    };

    return NextResponse.json({
      opportunity: {
        ...opportunity,
        dealer: dealerData,
        totalNeeded: opportunity.purchasePrice + opportunity.repairCost,
        investments,
      },
    });
  } catch (error) {
    console.error("GET /api/marketplace/opportunities/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/marketplace/opportunities/[id] — Aktualizace              */
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

    const { id } = await params;

    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    // Dealer může měnit jen svoje v PENDING_APPROVAL, admin může vždy
    const isAdmin = ADMIN_ROLES.includes(session.user.role);
    const isOwner = opportunity.dealerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const DEALER_EDITABLE_STATUSES = ["PENDING_APPROVAL", "IN_REPAIR", "FOR_SALE"];
    if (!isAdmin && !DEALER_EDITABLE_STATUSES.includes(opportunity.status)) {
      return NextResponse.json(
        { error: "Příležitost nelze upravit v tomto stavu" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateOpportunitySchema.parse(body);

    // V IN_REPAIR/FOR_SALE dealer smí měnit jen repair data
    if (!isAdmin && opportunity.status !== "PENDING_APPROVAL") {
      const allowedFields = ["repairPhotos", "repairDescription", "status"];
      const bodyKeys = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
      const forbidden = bodyKeys.filter(k => !allowedFields.includes(k));
      if (forbidden.length > 0) {
        return NextResponse.json(
          { error: `V tomto stavu nelze měnit: ${forbidden.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;
    if (data.vin !== undefined) updateData.vin = data.vin;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.photos !== undefined)
      updateData.photos = JSON.stringify(data.photos);
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = data.purchasePrice;
    if (data.repairCost !== undefined) updateData.repairCost = data.repairCost;
    if (data.estimatedSalePrice !== undefined)
      updateData.estimatedSalePrice = data.estimatedSalePrice;
    if (data.repairDescription !== undefined)
      updateData.repairDescription = data.repairDescription;
    if (data.repairPhotos !== undefined)
      updateData.repairPhotos = JSON.stringify(data.repairPhotos);
    if (data.actualSalePrice !== undefined)
      updateData.actualSalePrice = data.actualSalePrice;
    if (isAdmin && data.status !== undefined) updateData.status = data.status;
    if (isAdmin && data.adminNotes !== undefined)
      updateData.adminNotes = data.adminNotes;

    // Dealer může posunout status: IN_REPAIR → FOR_SALE (oprava dokončena)
    if (!isAdmin && data.status !== undefined) {
      if (opportunity.status === "IN_REPAIR" && data.status === "FOR_SALE") {
        updateData.status = data.status;
      } else {
        return NextResponse.json(
          { error: "Nemáte oprávnění měnit stav" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.flipOpportunity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/marketplace/opportunities/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
