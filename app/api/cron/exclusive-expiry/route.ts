import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/exclusive-expiry — denní kontrola expirace exkluzivity */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in14Days = new Date(today);
    in14Days.setDate(in14Days.getDate() + 14);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let notified = 0;
    let expired = 0;

    // 1) Vozidla kde exkluzivita vyprší za 14 dní — notifikace makléři
    const expiring14 = await prisma.vehicle.findMany({
      where: {
        exclusiveUntil: {
          gte: in14Days,
          lt: new Date(in14Days.getTime() + 86_400_000), // +1 den
        },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        brokerId: true,
        exclusiveUntil: true,
      },
    });

    for (const v of expiring14) {
      if (!v.brokerId) continue;
      await createNotification({
        userId: v.brokerId,
        type: "VEHICLE",
        title: "Exkluzivita vyprší za 14 dní",
        body: `Exkluzivní smlouva pro ${v.brand} ${v.model} vyprší ${v.exclusiveUntil!.toLocaleDateString("cs-CZ")}.`,
        link: `/makler/vehicles/${v.id}`,
      });
      notified++;
    }

    // 2) Vozidla kde exkluzivita vyprší za 7 dní — notifikace makléři + manažerovi
    const expiring7 = await prisma.vehicle.findMany({
      where: {
        exclusiveUntil: {
          gte: in7Days,
          lt: new Date(in7Days.getTime() + 86_400_000),
        },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        brokerId: true,
        exclusiveUntil: true,
        broker: { select: { managerId: true } },
      },
    });

    for (const v of expiring7) {
      if (!v.brokerId) continue;
      const vehicleName = `${v.brand} ${v.model}`;
      await createNotification({
        userId: v.brokerId,
        type: "VEHICLE",
        title: "Exkluzivita vyprší za 7 dní",
        body: `Exkluzivní smlouva pro ${vehicleName} vyprší ${v.exclusiveUntil!.toLocaleDateString("cs-CZ")}.`,
        link: `/makler/vehicles/${v.id}`,
      });
      notified++;

      if (v.broker?.managerId) {
        await createNotification({
          userId: v.broker.managerId,
          type: "VEHICLE",
          title: "Exkluzivita makléře vyprší za 7 dní",
          body: `Exkluzivní smlouva pro ${vehicleName} vyprší ${v.exclusiveUntil!.toLocaleDateString("cs-CZ")}.`,
          link: `/makler/vehicles/${v.id}`,
        });
        notified++;
      }
    }

    // 3) Vozidla kde exkluzivita vyprší zítra (za 1 den) — notifikace makléři + manažerovi
    const expiring1 = await prisma.vehicle.findMany({
      where: {
        exclusiveUntil: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 86_400_000),
        },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        brokerId: true,
        exclusiveUntil: true,
        broker: { select: { managerId: true } },
      },
    });

    for (const v of expiring1) {
      if (!v.brokerId) continue;
      const vehicleName = `${v.brand} ${v.model}`;
      await createNotification({
        userId: v.brokerId,
        type: "VEHICLE",
        title: "Exkluzivita vyprší zítra",
        body: `Exkluzivní smlouva pro ${vehicleName} vyprší ${v.exclusiveUntil!.toLocaleDateString("cs-CZ")}.`,
        link: `/makler/vehicles/${v.id}`,
      });
      notified++;

      if (v.broker?.managerId) {
        await createNotification({
          userId: v.broker.managerId,
          type: "VEHICLE",
          title: "Exkluzivita makléře vyprší zítra",
          body: `Exkluzivní smlouva pro ${vehicleName} vyprší ${v.exclusiveUntil!.toLocaleDateString("cs-CZ")}.`,
          link: `/makler/vehicles/${v.id}`,
        });
        notified++;
      }
    }

    // 4) Vozidla kde exkluzivita již vypršela — nastavit contract.status na EXPIRED
    const expiredVehicles = await prisma.vehicle.findMany({
      where: {
        exclusiveUntil: { lt: today },
        exclusiveContractId: { not: null },
      },
      select: {
        id: true,
        exclusiveContractId: true,
      },
    });

    for (const v of expiredVehicles) {
      if (!v.exclusiveContractId) continue;

      const contract = await prisma.contract.findUnique({
        where: { id: v.exclusiveContractId },
        select: { status: true },
      });

      if (contract && contract.status !== "EXPIRED" && contract.status !== "TERMINATED") {
        await prisma.contract.update({
          where: { id: v.exclusiveContractId },
          data: { status: "EXPIRED" },
        });
        expired++;
      }
    }

    return NextResponse.json({
      success: true,
      notified,
      expired,
    });
  } catch (error) {
    console.error("CRON exclusive-expiry error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
