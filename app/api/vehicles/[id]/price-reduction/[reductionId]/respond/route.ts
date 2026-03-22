import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

const respondSchema = z.object({
  action: z.enum(["ACCEPTED", "REJECTED", "MODIFIED"]),
  acceptedPrice: z.number().int().positive().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reductionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const { id: vehicleId, reductionId } = await params;
    const body = await request.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.action === "MODIFIED" && !parsed.data.acceptedPrice) {
      return NextResponse.json(
        { error: "Pri uprave je nutne zadat novou cenu" },
        { status: 400 }
      );
    }

    const reduction = await prisma.priceReduction.findFirst({
      where: { id: reductionId, vehicleId },
    });

    if (!reduction) {
      return NextResponse.json({ error: "Navrh nenalezen" }, { status: 404 });
    }

    if (reduction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Na tento navrh jiz bylo reagovano" },
        { status: 400 }
      );
    }

    // Update the reduction
    const updated = await prisma.priceReduction.update({
      where: { id: reductionId },
      data: {
        status: parsed.data.action,
        acceptedPrice: parsed.data.acceptedPrice ?? null,
        respondedAt: new Date(),
      },
    });

    // If accepted or modified, update vehicle price
    if (parsed.data.action === "ACCEPTED" || parsed.data.action === "MODIFIED") {
      const newPrice =
        parsed.data.action === "MODIFIED"
          ? parsed.data.acceptedPrice!
          : reduction.suggestedPrice;

      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { price: newPrice },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/vehicles/[id]/price-reduction/[reductionId]/respond error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
