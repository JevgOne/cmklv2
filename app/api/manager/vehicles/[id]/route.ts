import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  price: z.number().int().positive().optional(),
  priceReason: z.string().optional(),
  description: z.string().optional(),
  equipment: z.string().optional(),
  condition: z
    .enum(["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"])
    .optional(),
});

async function verifyManagerOwnership(managerId: string, vehicleId: string) {
  const teamBrokers = await prisma.user.findMany({
    where: { managerId, role: "BROKER" },
    select: { id: true },
  });

  const brokerIds = teamBrokers.map((b) => b.id);

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      brokerId: { in: brokerIds },
    },
  });

  return vehicle;
}

export async function GET(
  _request: Request,
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

    const vehicle = await verifyManagerOwnership(session.user.id, id);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno nebo nepatri vasemu makleri" },
        { status: 404 }
      );
    }

    // Vrátit plná data
    const fullVehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        images: { orderBy: { order: "asc" } },
        changeLog: { orderBy: { createdAt: "desc" }, take: 20 },
        contracts: { select: { id: true, status: true, type: true } },
      },
    });

    return NextResponse.json(fullVehicle);
  } catch (error) {
    console.error("Manager vehicle GET error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const data = updateSchema.parse(body);

    const vehicle = await verifyManagerOwnership(session.user.id, id);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno nebo nepatri vasemu makleri" },
        { status: 404 }
      );
    }

    // Cena vyžaduje důvod
    if (data.price !== undefined && data.price !== vehicle.price && !data.priceReason?.trim()) {
      return NextResponse.json(
        { error: "Pri zmene ceny je povinny duvod" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Log changes
      const changes: { field: string; oldValue: string | null; newValue: string | null; reason?: string }[] = [];

      if (data.price !== undefined && data.price !== vehicle.price) {
        changes.push({
          field: "price",
          oldValue: String(vehicle.price),
          newValue: String(data.price),
          reason: data.priceReason,
        });
      }

      if (data.description !== undefined && data.description !== vehicle.description) {
        changes.push({
          field: "description",
          oldValue: vehicle.description,
          newValue: data.description,
        });
      }

      if (data.equipment !== undefined && data.equipment !== vehicle.equipment) {
        changes.push({
          field: "equipment",
          oldValue: vehicle.equipment,
          newValue: data.equipment,
        });
      }

      if (data.condition !== undefined && data.condition !== vehicle.condition) {
        changes.push({
          field: "condition",
          oldValue: vehicle.condition,
          newValue: data.condition,
        });
      }

      // Vytvořit change logy
      for (const change of changes) {
        await tx.vehicleChangeLog.create({
          data: {
            vehicleId: id,
            userId: session.user.id,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            reason: change.reason ?? null,
          },
        });
      }

      // Update vehicle
      const updateData: Record<string, unknown> = {};
      if (data.price !== undefined) updateData.price = data.price;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.equipment !== undefined) updateData.equipment = data.equipment;
      if (data.condition !== undefined) updateData.condition = data.condition;

      return tx.vehicle.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Manager vehicle PUT error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}
