import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "BACKOFFICE") {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Chybí tělo požadavku" },
        { status: 400 }
      );
    }

    const data = approveSchema.parse(body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Schvalovat/zamítat lze pouze vozidla ve stavu PENDING
    if (vehicle.status !== "PENDING") {
      return NextResponse.json(
        { error: `Vozidlo není ve stavu PENDING (aktuální stav: ${vehicle.status})` },
        { status: 400 }
      );
    }

    // Zamítnutí vyžaduje důvod
    if (data.action === "reject" && !data.reason) {
      return NextResponse.json(
        { error: "Při zamítnutí je vyžadován důvod (reason)" },
        { status: 400 }
      );
    }

    const newStatus = data.action === "approve" ? "ACTIVE" : "REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: newStatus,
          reason: data.reason ?? null,
          flagged: false,
          flagReason: null,
        },
      });

      return tx.vehicle.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt:
            data.action === "approve" ? new Date() : vehicle.publishedAt,
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

    console.error("Vehicle approve error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
