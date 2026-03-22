import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { terminateExclusiveSchema } from "@/lib/validators/exclusive";

const reasonLabels: Record<string, string> = {
  SELLER_CHANGED_MIND: "Prodejce si to rozmyslel",
  SELLER_SOLD_PRIVATELY: "Prodejce prodal sám",
  VEHICLE_UNDRIVABLE: "Auto nepojízdné",
  OTHER: "Jiný důvod",
};

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
    const parsed = terminateExclusiveSchema.safeParse(body);

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
        exclusiveContractId: true,
        brand: true,
        model: true,
        status: true,
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

    const now = new Date();
    const reasonLabel = reasonLabels[parsed.data.reason] || parsed.data.reason;
    const terminationNote = parsed.data.note
      ? `${reasonLabel}: ${parsed.data.note}`
      : reasonLabel;

    // Update contract
    await prisma.contract.update({
      where: { id: vehicle.exclusiveContractId },
      data: {
        earlyTermination: true,
        terminationReason: terminationNote,
        terminationDate: now,
        status: "TERMINATED",
      },
    });

    // Archive vehicle and clear exclusive fields
    await prisma.vehicle.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        exclusiveUntil: null,
      },
    });

    // Log the change
    await prisma.vehicleChangeLog.create({
      data: {
        vehicleId: id,
        userId: session.user.id,
        field: "status",
        oldValue: vehicle.status,
        newValue: "ARCHIVED",
        reason: `Ukončení exkluzivní smlouvy: ${terminationNote}`,
      },
    });

    // Notify manager
    const broker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managerId: true, firstName: true, lastName: true },
    });

    if (broker?.managerId) {
      await prisma.notification.create({
        data: {
          userId: broker.managerId,
          type: "VEHICLE",
          title: "Ukončení exkluzivní smlouvy",
          body: `${broker.firstName} ${broker.lastName} ukončil smlouvu na ${vehicle.brand} ${vehicle.model}. Důvod: ${reasonLabel}`,
          link: `/makler/vehicles/${id}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/terminate-exclusive error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
