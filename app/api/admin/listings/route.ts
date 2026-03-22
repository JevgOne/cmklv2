import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/listings — Seznam vsech inzeratu pro admin panel    */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    if (!isAdmin) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));
    const skip = (page - 1) * limit;
    const search = params.get("search") || "";
    const flagged = params.get("flagged") === "true";
    const status = params.get("status") || "";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (flagged) {
      where.flagged = true;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { contactName: { contains: search } },
        {
          user: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { companyName: { contains: search } },
            ],
          },
        },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          slug: true,
          brand: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          listingType: true,
          status: true,
          isPremium: true,
          flagged: true,
          viewCount: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
              accountType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    // Count flags per listing (from flagReasons JSON)
    const serializedListings = listings.map((listing) => ({
      ...listing,
      flagCount: listing.flagged ? 1 : 0,
      createdAt: listing.createdAt.toISOString(),
    }));

    return NextResponse.json({
      listings: serializedListings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/listings error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
