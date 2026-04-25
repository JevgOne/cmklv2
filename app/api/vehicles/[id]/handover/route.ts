import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handoverVehicleSchema } from "@/lib/validators/sales";
import { calculateCommission } from "@/lib/commission-calculator";
import { addBrokerPoints, calculateCarSalePoints, type CareerLevelKey } from "@/lib/broker-points";
import { createNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/handover — Předání vozidla kupujícímu      */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Načtení vozidla s makléřem
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        broker: {
          select: { id: true, firstName: true, lastName: true, managerId: true, level: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění provést předání tohoto vozidla" },
        { status: 403 }
      );
    }

    // Kontrola stavu — pouze RESERVED nebo ACTIVE vozidla lze předat
    if (vehicle.status !== "RESERVED" && vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: `Vozidlo ve stavu "${vehicle.status}" nelze předat. Povolené stavy: ACTIVE, RESERVED`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = handoverVehicleSchema.parse(body);

    // Kontrola checklistu — vše musí být splněno
    const checklistItems = Object.entries(data.checklist);
    const unchecked = checklistItems.filter(([, value]) => !value);
    if (unchecked.length > 0) {
      return NextResponse.json(
        {
          error: `Nesplněné položky checklistu: ${unchecked.map(([key]) => key).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Výpočet provize dle úrovně makléře
    const brokerLevel = (vehicle.broker?.level ?? "TIPAR") as CareerLevelKey;
    const commissionBreakdown = calculateCommission(data.soldPrice, brokerLevel);

    const result = await prisma.$transaction(async (tx) => {
      // Change log
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: "SOLD",
          reason: data.note ?? "Předání vozidla kupujícímu",
          flagged: false,
          flagReason: null,
        },
      });

      // Aktualizace vozidla
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: "SOLD",
          soldPrice: data.soldPrice,
          soldAt: new Date(),
          handoverCompleted: true,
          commission: commissionBreakdown.total,
        },
        include: {
          images: { orderBy: { order: "asc" } },
          broker: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Vytvoření záznamu o provizi
      let commission = null;
      if (vehicle.brokerId) {
        commission = await tx.commission.create({
          data: {
            brokerId: vehicle.brokerId,
            vehicleId: vehicle.id,
            salePrice: data.soldPrice,
            commission: commissionBreakdown.total,
            brokerShare: commissionBreakdown.brokerShare,
            companyShare: commissionBreakdown.companyShare,
            managerBonus: commissionBreakdown.managerBonus,
            rate: 0.05,
            status: "PENDING",
            soldAt: new Date(),
          },
        });
      }

      return { vehicle: updatedVehicle, commission, commissionBreakdown };
    });

    // --- Body za prodej auta ---
    if (vehicle.brokerId && result.commission) {
      const points = calculateCarSalePoints(result.commissionBreakdown.total);
      const pointResult = await addBrokerPoints({
        brokerId: vehicle.brokerId,
        type: "CAR_SALE",
        points,
        vehicleId: vehicle.id,
        commissionId: result.commission.id,
        description: `Prodej ${vehicle.brand} ${vehicle.model} za ${data.soldPrice} Kč`,
        sourceAmount: result.commissionBreakdown.total,
      });

      if (pointResult.levelChanged) {
        await createNotification({
          userId: vehicle.brokerId,
          type: "SYSTEM",
          title: `Povýšení! Jste nyní ${pointResult.newLevel}`,
          body: `Celkem ${pointResult.newTotalPoints.toFixed(1)} bodů`,
          link: "/makler/stats",
        });
      }
    }

    // --- Notifikace po prodeji ---

    // 1. Notifikace makléři o provizi
    if (vehicle.brokerId) {
      await createNotification({
        userId: vehicle.brokerId,
        type: "COMMISSION",
        title: `Provize: ${result.commissionBreakdown.brokerShare} Kč`,
        body: `Prodáno: ${vehicle.brand} ${vehicle.model}`,
        link: `/makler/commissions`,
      });
    }

    // 2. Notifikace manažerovi
    if (vehicle.broker?.managerId) {
      const brokerName = `${vehicle.broker.firstName} ${vehicle.broker.lastName}`;
      await createNotification({
        userId: vehicle.broker.managerId,
        type: "VEHICLE",
        title: `Makléř ${brokerName} prodal ${vehicle.brand} ${vehicle.model}`,
        body: `Cena: ${data.soldPrice} Kč, provize: ${result.commissionBreakdown.total} Kč`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    // 3. Notifikace BackOffice (všichni ADMIN/BACKOFFICE uživatelé)
    const backofficeUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "BACKOFFICE"] } },
      select: { id: true },
    });

    await Promise.all(
      backofficeUsers.map((user) =>
        createNotification({
          userId: user.id,
          type: "VEHICLE",
          title: `Prodej: ${vehicle.brand} ${vehicle.model}`,
          body: `Cena: ${data.soldPrice} Kč`,
          link: `/admin/vehicles/${vehicle.id}`,
        })
      )
    );

    // --- Follow-up (FÁZE 4) ---
    // TODO: TASK-026 — automatický email kupujícímu po 7 dnech (follow-up systém)
    if (vehicle.brokerId) {
      await createNotification({
        userId: vehicle.brokerId,
        type: "SYSTEM",
        title: "Zavolej kupujícímu za 7 dní",
        body: `Follow-up po prodeji ${vehicle.brand} ${vehicle.model}`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/handover error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
