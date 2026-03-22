import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extendExclusiveSchema } from "@/lib/validators/exclusive";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = extendExclusiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        brokerId: true,
        exclusiveUntil: true,
        exclusiveContractId: true,
        brand: true,
        model: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    if (vehicle.brokerId !== session.user.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    if (!vehicle.exclusiveContractId) {
      return NextResponse.json(
        { error: "Vozidlo nemá exkluzivní smlouvu" },
        { status: 400 }
      );
    }

    const durationMonths = parseInt(parsed.data.duration, 10);
    const now = new Date();
    const startDate = vehicle.exclusiveUntil && vehicle.exclusiveUntil > now
      ? vehicle.exclusiveUntil
      : now;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Update contract with new exclusive end date
    await prisma.contract.update({
      where: { id: vehicle.exclusiveContractId },
      data: {
        exclusiveDuration: durationMonths,
        exclusiveEndDate: endDate,
        sellerSignature: parsed.data.sellerSignature,
        signedAt: now,
      },
    });

    // Update vehicle exclusive until
    await prisma.vehicle.update({
      where: { id },
      data: { exclusiveUntil: endDate },
    });

    // Log the change
    await prisma.vehicleChangeLog.create({
      data: {
        vehicleId: id,
        userId: session.user.id,
        field: "exclusiveUntil",
        oldValue: vehicle.exclusiveUntil?.toISOString() ?? null,
        newValue: endDate.toISOString(),
        reason: `Prodloužení exkluzivity o ${durationMonths} měsíc(e/ů)`,
      },
    });

    return NextResponse.json({
      success: true,
      exclusiveUntil: endDate,
    });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/extend-exclusive error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
