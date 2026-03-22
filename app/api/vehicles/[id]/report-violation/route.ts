import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportViolationSchema } from "@/lib/validators/exclusive";

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
    const parsed = reportViolationSchema.safeParse(body);

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

    const details = [
      parsed.data.description,
      parsed.data.evidenceUrl ? `URL: ${parsed.data.evidenceUrl}` : null,
      parsed.data.evidenceImage ? `Screenshot: ${parsed.data.evidenceImage}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Update contract
    await prisma.contract.update({
      where: { id: vehicle.exclusiveContractId },
      data: {
        violationReported: true,
        violationDetails: details,
      },
    });

    // Log the violation
    await prisma.vehicleChangeLog.create({
      data: {
        vehicleId: id,
        userId: session.user.id,
        field: "violationReported",
        oldValue: "false",
        newValue: "true",
        reason: `Porušení exkluzivity: ${parsed.data.description}`,
        flagged: true,
        flagReason: "Porušení exkluzivní smlouvy",
      },
    });

    // Notify manager and backoffice
    const broker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { managerId: true, firstName: true, lastName: true },
    });

    const notifyUserIds: string[] = [];
    if (broker?.managerId) {
      notifyUserIds.push(broker.managerId);
    }

    // Notify all BACKOFFICE users
    const backofficeUsers = await prisma.user.findMany({
      where: { role: "BACKOFFICE", status: "ACTIVE" },
      select: { id: true },
    });
    for (const bo of backofficeUsers) {
      if (!notifyUserIds.includes(bo.id)) {
        notifyUserIds.push(bo.id);
      }
    }

    await prisma.notification.createMany({
      data: notifyUserIds.map((userId) => ({
        userId,
        type: "VEHICLE",
        title: "Porušení exkluzivity",
        body: `${broker?.firstName ?? ""} ${broker?.lastName ?? ""} nahlásil porušení exkluzivity na ${vehicle.brand} ${vehicle.model}: ${parsed.data.description}`,
        link: `/makler/vehicles/${id}`,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/report-violation error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
