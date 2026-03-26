import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/quick-draft-expiry — expirace rychlych draftu        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Najdi vsechna DRAFT_QUICK vozidla s proslym deadline
    const quickDrafts = await prisma.vehicle.findMany({
      where: {
        status: "DRAFT_QUICK",
        quickDraftDeadline: { not: null },
      },
      include: {
        broker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    let archived = 0;
    let reminded = 0;

    for (const vehicle of quickDrafts) {
      if (!vehicle.quickDraftDeadline || !vehicle.brokerId) continue;

      const deadlinePassed = vehicle.quickDraftDeadline < now;
      if (!deadlinePassed) continue;

      const hoursSinceCreation =
        (now.getTime() - vehicle.createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation > 72) {
        // Archivovat — uplynulo vice nez 72h od vytvoreni
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { status: "ARCHIVED" },
        });

        await prisma.vehicleChangeLog.create({
          data: {
            vehicleId: vehicle.id,
            userId: vehicle.brokerId,
            field: "status",
            oldValue: "DRAFT_QUICK",
            newValue: "ARCHIVED",
            reason: "Automatická deaktivace — nedoplněno do 72h",
          },
        });

        await createNotification({
          userId: vehicle.brokerId,
          type: "VEHICLE",
          title: "Rychlý draft deaktivován",
          body: `Vozidlo ${vehicle.brand} ${vehicle.model} bylo archivováno — údaje nebyly doplněny do 72 hodin.`,
          link: `/makler/vehicles/${vehicle.id}`,
        });

        archived++;
      } else {
        // Pripomenuti — deadline prosel, ale jeste neni 72h
        await createNotification({
          userId: vehicle.brokerId,
          type: "VEHICLE",
          title: "Doplňte údaje k vozidlu",
          body: `Doplňte údaje k vozu ${vehicle.brand} ${vehicle.model}, jinak bude draft deaktivován.`,
          link: `/makler/vehicles/${vehicle.id}/edit`,
        });

        reminded++;
      }
    }

    return NextResponse.json({
      success: true,
      total: quickDrafts.length,
      archived,
      reminded,
    });
  } catch (error) {
    console.error("CRON quick-draft-expiry error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
