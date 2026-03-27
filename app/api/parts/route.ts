import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPartSchema, partFilterSchema } from "@/lib/validators/parts";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  POST /api/parts — Vytvoření dílu                                   */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    // Role check: PARTS_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE
    const allowedRoles = ["PARTS_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = createPartSchema.parse(body);

    // Generovat slug
    const baseSlug = slugify(data.name);
    const existing = await prisma.part.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const part = await prisma.part.create({
      data: {
        slug,
        supplierId: session.user.id,
        name: data.name,
        category: data.category,
        description: data.description ?? null,
        partNumber: data.partNumber ?? null,
        oemNumber: data.oemNumber ?? null,
        condition: data.condition,
        price: data.price,
        currency: data.currency ?? "CZK",
        vatIncluded: data.vatIncluded ?? true,
        stock: data.stock ?? 1,
        weight: data.weight ?? null,
        dimensions: data.dimensions ?? null,
        compatibleBrands: data.compatibleBrands ? JSON.stringify(data.compatibleBrands) : null,
        compatibleModels: data.compatibleModels ? JSON.stringify(data.compatibleModels) : null,
        compatibleYearFrom: data.compatibleYearFrom ?? null,
        compatibleYearTo: data.compatibleYearTo ?? null,
        universalFit: data.universalFit ?? false,
        status: "ACTIVE",
        images: data.images
          ? {
              create: data.images.map((img) => ({
                url: img.url,
                order: img.order,
                isPrimary: img.isPrimary ?? false,
              })),
            }
          : undefined,
      },
      include: { images: true },
    });

    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/parts error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/parts — Katalog dílů s filtrací                           */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filters = partFilterSchema.parse(Object.fromEntries(params));

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (filters.category) where.category = filters.category;
    if (filters.condition) where.condition = filters.condition;
    if (filters.partType) where.partType = filters.partType;

    if (filters.brand) {
      where.compatibleBrands = { contains: filters.brand };
    }
    if (filters.model) {
      where.compatibleModels = { contains: filters.model };
    }

    if (filters.year) {
      where.AND = [
        { OR: [{ compatibleYearFrom: null }, { compatibleYearFrom: { lte: filters.year } }] },
        { OR: [{ compatibleYearTo: null }, { compatibleYearTo: { gte: filters.year } }] },
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice) priceFilter.gte = filters.minPrice;
      if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
      where.price = priceFilter;
    }

    if (filters.inStock) {
      where.stock = { gt: 0 };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { oemNumber: { contains: filters.search } },
        { partNumber: { contains: filters.search } },
      ];
    }

    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder>[];
    switch (filters.sort) {
      case "cheapest":
        orderBy = [{ price: "asc" }];
        break;
      case "expensive":
        orderBy = [{ price: "desc" }];
        break;
      case "popular":
        orderBy = [{ viewCount: "desc" }];
        break;
      case "newest":
      default:
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          supplier: {
            select: { id: true, firstName: true, lastName: true, companyName: true },
          },
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      prisma.part.count({ where }),
    ]);

    return NextResponse.json({
      parts,
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
    console.error("GET /api/parts error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
