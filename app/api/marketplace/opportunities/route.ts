import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createOpportunitySchema,
  opportunityFilterSchema,
} from "@/lib/validators/marketplace";

const DEALER_ROLES = ["VERIFIED_DEALER", "ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/opportunities — Dealer vytvoří příležitost   */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    if (!DEALER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = createOpportunitySchema.parse(body);

    const opportunity = await prisma.flipOpportunity.create({
      data: {
        dealerId: session.user.id,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        vin: data.vin ?? null,
        condition: data.condition,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        purchasePrice: data.purchasePrice,
        repairCost: data.repairCost,
        estimatedSalePrice: data.estimatedSalePrice,
        repairDescription: data.repairDescription ?? null,
        repairPhotos: data.repairPhotos
          ? JSON.stringify(data.repairPhotos)
          : null,
        status: "PENDING_APPROVAL",
      },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/opportunities error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/opportunities — Seznam příležitostí           */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const filters = opportunityFilterSchema.parse(Object.fromEntries(params));

    const where: Record<string, unknown> = {};

    // Dealers vidí jen svoje, investoři vidí FUNDING+, admin vidí vše
    if (session.user.role === "VERIFIED_DEALER") {
      where.dealerId = session.user.id;
    } else if (session.user.role === "INVESTOR") {
      where.status = {
        in: [
          "FUNDING",
          "FUNDED",
          "IN_REPAIR",
          "FOR_SALE",
          "SOLD",
          "PAYOUT_PENDING",
          "COMPLETED",
        ],
      };
    }
    // ADMIN/BACKOFFICE vidí vše

    if (filters.status) where.status = filters.status;
    if (filters.brand) where.brand = { contains: filters.brand };
    if (filters.dealerId) where.dealerId = filters.dealerId;

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice) priceFilter.gte = filters.minPrice;
      if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
      where.purchasePrice = priceFilter;
    }

    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder>[];
    switch (filters.sort) {
      case "cheapest":
        orderBy = [{ purchasePrice: "asc" }];
        break;
      case "expensive":
        orderBy = [{ purchasePrice: "desc" }];
        break;
      case "highest_roi":
        orderBy = [{ estimatedSalePrice: "desc" }];
        break;
      case "newest":
      default:
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [opportunities, total] = await Promise.all([
      prisma.flipOpportunity.findMany({
        where,
        include: {
          dealer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          investments: {
            where: { paymentStatus: "CONFIRMED" },
            select: { amount: true },
          },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.flipOpportunity.count({ where }),
    ]);

    const result = opportunities.map((opp) => ({
      ...opp,
      totalNeeded: opp.purchasePrice + opp.repairCost,
      confirmedFunding: opp.investments.reduce(
        (sum, inv) => sum + inv.amount,
        0
      ),
      investments: undefined,
    }));

    return NextResponse.json({
      opportunities: result,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatné parametry", details: error.issues },
        { status: 400 }
      );
    }
    console.error("GET /api/marketplace/opportunities error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
