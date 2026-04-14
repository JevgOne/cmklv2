import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/suppliers/[id]/reviews — Veřejná hodnocení dodavatele      */
/* ------------------------------------------------------------------ */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: supplierId } = await params;
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      prisma.supplierReview.findMany({
        where: { supplierId, isPublic: true },
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          buyer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supplierReview.count({ where: { supplierId, isPublic: true } }),
      prisma.supplierReview.aggregate({
        where: { supplierId, isPublic: true },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null,
      totalCount: total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/suppliers/[id]/reviews error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
