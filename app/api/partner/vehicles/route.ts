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

    // Validate required fields
    if (!body.brand || !body.model || !body.price) {
      return NextResponse.json(
        { error: "Znacka, model a cena jsou povinne" },
        { status: 400 }
      );
    }

    // Generate a placeholder VIN if not provided (partner vehicles may not always have VIN upfront)
    const vin = body.vin && body.vin.trim().length >= 17
      ? body.vin.trim()
      : `PARTNER-${session.user.id.slice(-6)}-${Date.now().toString(36)}`.toUpperCase();

    // Simplified vehicle creation for partners
    const vehicle = await prisma.vehicle.create({
      data: {
        vin,
        brand: body.brand,
        model: body.model,
        variant: body.variant || null,
        year: body.year || new Date().getFullYear(),
        mileage: body.mileage || 0,
        fuelType: body.fuelType || "PETROL",
        transmission: body.transmission || "MANUAL",
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

    // Create vehicle images if provided
    if (body.images?.length) {
      await prisma.vehicleImage.createMany({
        data: body.images.map((img: { url: string }, i: number) => ({
          vehicleId: vehicle.id,
          url: img.url,
          order: i,
          isPrimary: i === 0,
        })),
      });
    }

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/vehicles error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}
