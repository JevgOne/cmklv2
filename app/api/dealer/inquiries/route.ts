import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inquiryListQuerySchema } from "@/lib/validators/dealer-inquiry";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "ADVERTISER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = inquiryListQuerySchema.parse(searchParams);

    const where: Prisma.InquiryWhereInput = {
      listing: { userId: session.user.id },
    };

    if (query.status) {
      const statuses = query.status.split(",");
      where.status = { in: statuses };
    }

    if (query.listingId) {
      where.listingId = query.listingId;
    }

    if (query.search) {
      const q = query.search;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const orderBy: Prisma.InquiryOrderByWithRelationInput =
      query.sort === "oldest"
        ? { createdAt: "asc" }
        : query.sort === "priority"
          ? { priority: "asc" }
          : { createdAt: "desc" };

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          listing: {
            select: {
              id: true,
              slug: true,
              brand: true,
              model: true,
              variant: true,
              year: true,
              price: true,
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
            },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    const result = inquiries.map((inq) => ({
      ...inq,
      createdAt: inq.createdAt.toISOString(),
      updatedAt: inq.updatedAt.toISOString(),
      repliedAt: inq.repliedAt?.toISOString() ?? null,
      viewingDate: inq.viewingDate?.toISOString() ?? null,
      listing: {
        ...inq.listing,
        image: inq.listing.images[0]?.url ?? null,
        images: undefined,
      },
    }));

    return NextResponse.json({
      inquiries: result,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    console.error("GET /api/dealer/inquiries error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
