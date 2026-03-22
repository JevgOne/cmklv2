import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTNER_BAZAR") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {
      brokerId: session.user.id,
    };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { inquiries: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      vehicles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/partner/vehicles error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTNER_BAZAR") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const body = await request.json();

    // Simplified vehicle creation for partners
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: body.vin,
        brand: body.brand,
        model: body.model,
        variant: body.variant || null,
        year: body.year,
        mileage: body.mileage,
        fuelType: body.fuelType,
        transmission: body.transmission,
        enginePower: body.enginePower || null,
        engineCapacity: body.engineCapacity || null,
        bodyType: body.bodyType || null,
        color: body.color || null,
        condition: body.condition || "GOOD",
        price: body.price,
        city: body.city || "",
        description: body.description || null,
        equipment: body.equipment || null,
        brokerId: session.user.id,
        status: "PENDING",
        sellerType: "broker",
        contactName: session.user.firstName + " " + session.user.lastName,
        contactPhone: body.contactPhone || "",
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/vehicles error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
