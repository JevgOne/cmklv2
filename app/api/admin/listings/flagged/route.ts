import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/listings/flagged — Nahlášené inzeráty (BackOffice)  */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (!isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "PENDING_REVIEW";
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    const where = {
      flagged: true,
      ...(status !== "all" ? { moderationStatus: status } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, accountType: true },
          },
        },
        orderBy: { flaggedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/listings/flagged error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
