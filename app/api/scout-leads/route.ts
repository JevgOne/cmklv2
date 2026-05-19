import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const assignedToId = searchParams.get("assignedToId");
    const regionId = searchParams.get("regionId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const role = session.user.role;
    const userId = session.user.id;

    // RBAC
    const where: Record<string, unknown> = {};

    if (role === "BROKER") {
      where.assignedToId = userId;
      where.category = "SOUKROMNIK";
    } else if (role === "MANAGER" || role === "REGIONAL_DIRECTOR") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true },
      });
      if (user?.regionId) {
        where.regionId = user.regionId;
      }
    } else if (role === "ADMIN" || role === "BACKOFFICE") {
      // See all
    } else {
      return NextResponse.json(
        { error: "Nemáte oprávnění" },
        { status: 403 }
      );
    }

    // Filters
    if (category) where.category = category;
    if (country) where.country = country;
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedToId && role !== "BROKER") where.assignedToId = assignedToId;
    if (regionId && role !== "BROKER") where.regionId = regionId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { ico: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const allowedSorts: Record<string, string> = {
      createdAt: "createdAt",
      score: "score",
      name: "name",
      city: "city",
    };
    const orderField = allowedSorts[sortBy] || "createdAt";

    const [leads, total] = await Promise.all([
      prisma.scoutLead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          linkedRegion: { select: { id: true, name: true } },
        },
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.scoutLead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/scout-leads error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
