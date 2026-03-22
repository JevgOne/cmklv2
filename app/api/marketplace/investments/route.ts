import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createInvestmentSchema,
  investmentFilterSchema,
} from "@/lib/validators/marketplace";

const INVESTOR_ROLES = ["INVESTOR", "ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/marketplace/investments — Investor investuje              */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    if (!INVESTOR_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = createInvestmentSchema.parse(body);

    // Ověřit, že příležitost existuje a je ve stavu FUNDING
    const opportunity = await prisma.flipOpportunity.findUnique({
      where: { id: data.opportunityId },
      include: {
        investments: {
          where: { paymentStatus: { in: ["PENDING", "CONFIRMED"] } },
          select: { amount: true },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Příležitost nenalezena" },
        { status: 404 }
      );
    }

    if (opportunity.status !== "FUNDING") {
      return NextResponse.json(
        { error: "Příležitost nepřijímá investice" },
        { status: 400 }
      );
    }

    // Ověřit, že celková investice nepřesáhne potřebnou částku
    const totalNeeded = opportunity.purchasePrice + opportunity.repairCost;
    const alreadyInvested = opportunity.investments.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );
    const remaining = totalNeeded - alreadyInvested;

    if (data.amount > remaining) {
      return NextResponse.json(
        {
          error: `Maximální investice je ${remaining} Kč (zbývá do plného financování)`,
        },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.create({
      data: {
        investorId: session.user.id,
        opportunityId: data.opportunityId,
        amount: data.amount,
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({ investment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/marketplace/investments error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/investments — Moje investice                   */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const filters = investmentFilterSchema.parse(Object.fromEntries(params));

    const where: Record<string, unknown> = {};

    // Investor vidí jen svoje, admin vidí vše
    if (!["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      where.investorId = session.user.id;
    }

    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.opportunityId) where.opportunityId = filters.opportunityId;

    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder>[];
    switch (filters.sort) {
      case "amount_asc":
        orderBy = [{ amount: "asc" }];
        break;
      case "amount_desc":
        orderBy = [{ amount: "desc" }];
        break;
      case "newest":
      default:
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        include: {
          opportunity: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              status: true,
              purchasePrice: true,
              repairCost: true,
              estimatedSalePrice: true,
              actualSalePrice: true,
              photos: true,
            },
          },
          investor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.investment.count({ where }),
    ]);

    return NextResponse.json({
      investments,
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
    console.error("GET /api/marketplace/investments error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
