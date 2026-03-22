import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/quick — Rychlé nabírání (DRAFT_QUICK)          */
/* ------------------------------------------------------------------ */

const quickVehicleSchema = z.object({
  // Krok 1: VIN + kontakt
  vin: z
    .string()
    .regex(
      /^[A-HJ-NPR-Z0-9]{17}$/i,
      "VIN musí mít 17 znaků a platný formát"
    ),
  sellerName: z.string().min(1, "Jméno prodejce je povinné"),
  sellerPhone: z.string().min(1, "Telefon prodejce je povinný"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // VIN decoded data (volitelné)
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  variant: z.string().optional(),
  year: z.number().int().min(1900).max(2100),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  enginePower: z.number().int().optional(),
  engineCapacity: z.number().int().optional(),
  bodyType: z.string().optional(),
  doorsCount: z.number().int().optional(),
  seatsCount: z.number().int().optional(),

  // Krok 2: Fotky (URLs z Cloudinary)
  images: z
    .array(
      z.object({
        url: z.string().url(),
        isPrimary: z.boolean().optional(),
        order: z.number().int().optional(),
      })
    )
    .min(5, "Minimálně 5 fotek je povinných"),

  // Krok 3: Cena + detaily
  mileage: z.number().int().min(0),
  price: z.number().int().min(1, "Cena musí být vyšší než 0"),
  condition: z.string().min(1, "Stav vozidla je povinný"),
  city: z.string().optional(),
});

function generateSlug(brand: string, model: string, year: number): string {
  const base = `${brand}-${model}-${year}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    // Ověření, že má povolený rychlý režim
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { quickModeEnabled: true, role: true },
    });

    if (!user?.quickModeEnabled) {
      return NextResponse.json(
        { error: "Rychlé nabírání není povoleno pro váš účet." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = quickVehicleSchema.parse(body);

    // Kontrola duplicity VIN
    const existingVin = await prisma.vehicle.findUnique({
      where: { vin: data.vin },
    });
    if (existingVin) {
      return NextResponse.json(
        { error: "Vozidlo s tímto VIN již existuje" },
        { status: 409 }
      );
    }

    const slug = generateSlug(data.brand, data.model, data.year);

    // 48h deadline
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 48);

    // Provize: 5% z ceny, min 25 000 Kč
    const commission = Math.max(data.price * 0.05, 25000);

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: data.vin,
        vinLocked: true,
        brand: data.brand,
        model: data.model,
        variant: data.variant ?? null,
        year: data.year,
        mileage: data.mileage,
        slug,
        fuelType: data.fuelType ?? "PETROL",
        transmission: data.transmission ?? "MANUAL",
        enginePower: data.enginePower ?? null,
        engineCapacity: data.engineCapacity ?? null,
        bodyType: data.bodyType ?? null,
        doorsCount: data.doorsCount ?? null,
        seatsCount: data.seatsCount ?? null,
        condition: data.condition,
        price: data.price,
        priceNegotiable: true,
        commission: Math.round(commission),
        status: "DRAFT_QUICK",
        quickDraftDeadline: deadline,
        sellerType: "broker",
        brokerId: session.user.id,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        city: data.city ?? "Nezadáno",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        images: {
          create: data.images.map((img, index) => ({
            url: img.url,
            isPrimary: img.isPrimary ?? index === 0,
            order: img.order ?? index,
          })),
        },
      },
      include: {
        images: true,
        broker: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[]) ?? [];
      if (target.includes("vin")) {
        return NextResponse.json(
          { error: "Vozidlo s tímto VIN již existuje" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Interní chyba serveru. Zkuste to prosím znovu." },
        { status: 500 }
      );
    }

    console.error("POST /api/vehicles/quick error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
