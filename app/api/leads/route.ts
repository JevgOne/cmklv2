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
    const status = searchParams.get("status");
    const regionId = searchParams.get("regionId");
    const source = searchParams.get("source");
    const assignedToId = searchParams.get("assignedToId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const role = session.user.role;
    const userId = session.user.id;

    // Role-based filtering
    const where: Record<string, unknown> = {};

    if (role === "BROKER") {
      // Makléř vidí pouze své leady
      where.assignedToId = userId;
    } else if (role === "MANAGER") {
      // Manažer vidí leady svého regionu
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { regionId: true },
      });
      if (manager?.regionId) {
        where.regionId = manager.regionId;
      }
    } else if (role === "ADMIN" || role === "BACKOFFICE" || role === "REGIONAL_DIRECTOR") {
      // Admin/Backoffice/Ředitel vidí vše
    } else {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    // Apply filters
    if (status) where.status = status;
    if (regionId && role !== "BROKER") where.regionId = regionId;
    if (source) where.source = source;
    if (assignedToId && role !== "BROKER") where.assignedToId = assignedToId;

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, slug: true },
          },
          assignedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          region: { select: { id: true, name: true } },
          vehicle: { select: { id: true, brand: true, model: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
