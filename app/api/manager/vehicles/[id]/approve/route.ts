import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createManagerNotification } from "@/lib/notifications";

const approveSchema = z.object({
  action: z.enum(["approve", "return", "reject"]),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Chybi telo pozadavku" },
        { status: 400 }
      );
    }

    const data = approveSchema.parse(body);

    // Vrácení a zamítnutí vyžaduje důvod
    if ((data.action === "return" || data.action === "reject") && !data.reason?.trim()) {
      return NextResponse.json(
        { error: "Duvod je povinny" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        broker: {
          select: { id: true, managerId: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    if (vehicle.status !== "PENDING") {
      return NextResponse.json(
        { error: `Vozidlo neni ve stavu PENDING (aktualni stav: ${vehicle.status})` },
        { status: 400 }
      );
    }

    // Ownership check: vozidlo musí patřit makléři tohoto manažera
    if (!vehicle.broker || vehicle.broker.managerId !== session.user.id) {
      return NextResponse.json(
        { error: "Vozidlo nepatri vasemu makleri" },
        { status: 403 }
      );
    }

    // Hierarchie: manažer nemůže schvalovat vlastní vozidla
    if (vehicle.brokerId === session.user.id) {
      return NextResponse.json(
        { error: "Vlastni vozidla musi schvalit BACKOFFICE" },
        { status: 403 }
      );
    }

    let newStatus: string;
    let notificationAction: "approved" | "returned" | "rejected";

    switch (data.action) {
      case "approve":
        newStatus = "ACTIVE";
        notificationAction = "approved";
        break;
      case "return":
        newStatus = "PENDING"; // zůstane PENDING, přidá se rejectionReason
        notificationAction = "returned";
        break;
      case "reject":
        newStatus = "REJECTED";
        notificationAction = "rejected";
        break;
    }

    const vehicleName = `${vehicle.brand} ${vehicle.model}`;

    const updated = await prisma.$transaction(async (tx) => {
      // VehicleChangeLog
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: data.action === "return" ? "PENDING (returned)" : newStatus,
          reason: data.reason ?? null,
        },
      });

      // Update vehicle
      const updateData: Record<string, unknown> = {};

      if (data.action === "approve") {
        updateData.status = "ACTIVE";
        updateData.publishedAt = new Date();
        updateData.rejectionReason = null;
      } else if (data.action === "return") {
        // Zůstane PENDING ale s důvodem
        updateData.rejectionReason = data.reason;
      } else {
        updateData.status = "REJECTED";
        updateData.rejectionReason = data.reason;
      }

      const result = await tx.vehicle.update({
        where: { id },
        data: updateData,
      });

      return result;
    });

    // Notifikace makléři (mimo transakci)
    if (vehicle.brokerId) {
      await createManagerNotification({
        brokerId: vehicle.brokerId,
        vehicleId: vehicle.id,
        action: notificationAction,
        vehicleName,
        reason: data.reason,
      });
    }

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Manager vehicle approve error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
