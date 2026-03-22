import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const vinSchema = z.string().regex(
  /^[A-HJ-NPR-Z0-9]{17}$/,
  "VIN musí mít 17 znaků a platný formát (bez I, O, Q)"
);

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    // Query param
    const { searchParams } = new URL(request.url);
    const rawVin = searchParams.get("vin")?.toUpperCase().trim();

    if (!rawVin) {
      return NextResponse.json(
        { error: "Parametr vin je povinný" },
        { status: 400 }
      );
    }

    // Validace
    const parseResult = vinSchema.safeParse(rawVin);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // Kontrola duplicity
    const existing = await prisma.vehicle.findUnique({
      where: { vin: parseResult.data },
      select: {
        id: true,
        brand: true,
        model: true,
        status: true,
        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        exists: true,
        vehicle: {
          id: existing.id,
          brand: existing.brand,
          model: existing.model,
          status: existing.status,
          broker: existing.broker
            ? `${existing.broker.firstName} ${existing.broker.lastName}`
            : null,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("GET /api/vin/check-duplicate error:", error);
    return NextResponse.json(
      { error: "Chyba při kontrole duplicity VIN" },
      { status: 500 }
    );
  }
}
