import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDamageSchema } from "@/lib/validators/sales";
import { createNotification } from "@/lib/notifications";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/damage — Nahlášení poškození               */
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
          select: { id: true, firstName: true, lastName: true, managerId: true },
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
        { error: "Nemáte oprávnění nahlásit poškození tohoto vozidla" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createDamageSchema.parse(body);

    const damageReport = await prisma.damageReport.create({
      data: {
        vehicleId: vehicle.id,
        reportedById: session.user.id,
        description: data.description,
        severity: data.severity,
        images: data.images ? JSON.stringify(data.images) : null,
      },
    });

    // VehicleChangeLog pro každý damage report
    await prisma.vehicleChangeLog.create({
      data: {
        vehicleId: vehicle.id,
        userId: session.user.id,
        field: "DAMAGE_REPORT",
        oldValue: null,
        newValue: `${data.severity}: ${data.description}`,
        reason: "Nahlášení poškození",
        flagged: false,
        flagReason: null,
      },
    });

    // Deaktivace vozidla při FUNCTIONAL nebo SEVERE poškození
    if (data.severity === "FUNCTIONAL" || data.severity === "SEVERE") {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "ARCHIVED" },
      });

      await prisma.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: "ARCHIVED",
          reason: `Deaktivováno kvůli poškození: ${data.severity}`,
          flagged: false,
          flagReason: null,
        },
      });

      // Notifikace manažerovi
      if (vehicle.broker?.managerId) {
        await createNotification({
          userId: vehicle.broker.managerId,
          type: "VEHICLE",
          title: `Vozidlo deaktivováno — ${data.severity} poškození`,
          body: `${vehicle.brand} ${vehicle.model}: ${data.description}`,
          link: `/makler/vehicles/${vehicle.id}`,
        });
      }

      // SEVERE: notifikace i BackOffice
      if (data.severity === "SEVERE") {
        const backofficeUsers = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "BACKOFFICE"] } },
          select: { id: true },
        });

        await Promise.all(
          backofficeUsers.map((user) =>
            createNotification({
              userId: user.id,
              type: "VEHICLE",
              title: `Vážné poškození: ${vehicle.brand} ${vehicle.model}`,
              body: data.description,
              link: `/admin/vehicles/${vehicle.id}`,
            })
          )
        );
      }
    }

    return NextResponse.json({ damageReport }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/damage error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
