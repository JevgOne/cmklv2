import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        broker: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        images: { orderBy: { order: "asc" } },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("GET /api/admin/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

const updateSchema = z.object({
  price: z.number().min(0).optional(),
  priceReason: z.string().optional(),
  description: z.string().optional(),
  equipment: z.string().optional(),
  condition: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const priceChanged = data.price !== undefined && data.price !== vehicle.price;
    if (priceChanged && !data.priceReason?.trim()) {
      return NextResponse.json(
        { error: "Při změně ceny je povinný důvod" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (priceChanged) {
        await tx.vehicleChangeLog.create({
          data: {
            vehicleId: vehicle.id,
            userId: session.user.id,
            field: "price",
            oldValue: String(vehicle.price),
            newValue: String(data.price),
            reason: data.priceReason ?? null,
            flagged: false,
            flagReason: null,
          },
        });
      }

      return tx.vehicle.update({
        where: { id },
        data: {
          ...(data.price !== undefined && { price: data.price }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.equipment !== undefined && { equipment: data.equipment }),
          ...(data.condition !== undefined && { condition: data.condition }),
        },
      });
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
