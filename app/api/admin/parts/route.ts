import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.role ||
      !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const partType = searchParams.get("partType");
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (partType) where.partType = partType;
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { partNumber: { contains: search, mode: "insensitive" } },
        { oemNumber: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          partType: true,
          condition: true,
          status: true,
          price: true,
          stock: true,
          manufacturer: true,
          oemNumber: true,
          partNumber: true,
          viewCount: true,
          createdAt: true,
          supplier: {
            select: { id: true, firstName: true, lastName: true, companyName: true },
          },
          images: {
            select: { url: true },
            take: 1,
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.part.count({ where }),
    ]);

    return NextResponse.json({
      parts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/parts error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.role ||
      !["ADMIN", "BACKOFFICE"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const body = await request.json();
    const data = bulkUpdateSchema.parse(body);

    const result = await prisma.part.updateMany({
      where: { id: { in: data.ids } },
      data: { status: data.status },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/parts error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
