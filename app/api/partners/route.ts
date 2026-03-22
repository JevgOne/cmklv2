import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPartnerSchema } from "@/lib/validators/partner";
import { slugify } from "@/lib/utils";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const region = searchParams.get("region");
    const managerId = searchParams.get("managerId");
    const size = searchParams.get("size");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (region) where.region = region;
    if (managerId) where.managerId = managerId;
    if (size) where.estimatedSize = size;

    // Manager vidi jen sve partnery
    if (session.user.role === "MANAGER") {
      where.managerId = session.user.id;
    }

    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { activities: true, leads: true } },
        },
        orderBy: { score: "desc" },
        skip,
        take: limit,
      }),
      prisma.partner.count({ where }),
    ]);

    return NextResponse.json({
      partners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/partners error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createPartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Generate slug
    let slug = slugify(data.name);
    const existing = await prisma.partner.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const partner = await prisma.partner.create({
      data: {
        ...data,
        slug,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("POST /api/partners error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
