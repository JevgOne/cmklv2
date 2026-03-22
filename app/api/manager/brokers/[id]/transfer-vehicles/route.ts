import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transferVehiclesSchema } from "@/lib/validators/escalation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id: sourceBrokerId } = await params;
    const managerId = session.user.id;

    // Ověřit, že zdrojový makléř patří pod tohoto manažera
    const sourceBroker = await prisma.user.findFirst({
      where: { id: sourceBrokerId, managerId, role: "BROKER" },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!sourceBroker) {
      return NextResponse.json(
        { error: "Makléř nenalezen nebo nepatří pod vás" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = transferVehiclesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { vehicleIds, targetBrokerId, reason } = parsed.data;

    // Ověřit, že cílový makléř patří pod stejného manažera
    const targetBroker = await prisma.user.findFirst({
      where: { id: targetBrokerId, managerId, role: "BROKER" },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!targetBroker) {
      return NextResponse.json(
        { error: "Cílový makléř nenalezen nebo nepatří pod vás" },
        { status: 404 }
      );
    }

    if (sourceBrokerId === targetBrokerId) {
      return NextResponse.json(
        { error: "Nelze přenést vozy na stejného makléře" },
        { status: 400 }
      );
    }

    // Ověřit, že vozidla patří zdrojovému makléři
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, brokerId: sourceBrokerId },
      select: { id: true, brand: true, model: true },
    });

    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: "Žádná vozidla k přenosu nebyla nalezena" },
        { status: 400 }
      );
    }

    // Hromadný přenos — update vozidel + change log
    const transferredIds = vehicles.map((v) => v.id);

    await prisma.$transaction(async (tx) => {
      // Aktualizovat brokerId na všech vozidlech
      await tx.vehicle.updateMany({
        where: { id: { in: transferredIds } },
        data: { brokerId: targetBrokerId },
      });

      // Vytvořit change log záznamy
      const changeLogs = transferredIds.map((vehicleId) => ({
        vehicleId,
        userId: managerId,
        field: "brokerId",
        oldValue: `${sourceBroker.firstName} ${sourceBroker.lastName} (${sourceBrokerId})`,
        newValue: `${targetBroker.firstName} ${targetBroker.lastName} (${targetBrokerId})`,
        reason: `Přenos vozidla: ${reason}`,
      }));

      for (const log of changeLogs) {
        await tx.vehicleChangeLog.create({ data: log });
      }

      // Notifikace novému makléři
      await tx.notification.create({
        data: {
          userId: targetBrokerId,
          type: "VEHICLE",
          title: "Přenesená vozidla",
          body: `Bylo vám přeneseno ${transferredIds.length} vozidel od ${sourceBroker.firstName} ${sourceBroker.lastName}. Důvod: ${reason}`,
          link: "/makler/vehicles",
        },
      });
    });

    return NextResponse.json({
      success: true,
      transferred: transferredIds.length,
    });
  } catch (error) {
    console.error("POST /api/manager/brokers/[id]/transfer-vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
