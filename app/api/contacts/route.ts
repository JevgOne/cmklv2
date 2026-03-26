import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContactSchema } from "@/lib/validators/contact";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const brokerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // all, with_vehicle, without_vehicle, follow_up
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = { brokerId };

    if (filter === "with_vehicle") {
      where.totalVehicles = { gt: 0 };
    } else if (filter === "without_vehicle") {
      where.totalVehicles = 0;
    } else if (filter === "follow_up") {
      where.nextFollowUp = { lte: new Date() };
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      prisma.sellerContact.findMany({
        where,
        include: {
          _count: { select: { vehicles: true, communications: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sellerContact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/contacts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nextFollowUp, ...rest } = parsed.data;

    const contact = await prisma.sellerContact.create({
      data: {
        ...rest,
        brokerId: session.user.id,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
