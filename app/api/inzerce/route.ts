import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/inzerce — Vložení soukromého inzerátu (bez auth)         */
/* ------------------------------------------------------------------ */

const fuelTypeMap: Record<string, string> = {
  "Benzín": "PETROL",
  "Diesel": "DIESEL",
  "Hybrid": "HYBRID",
  "Elektro": "ELECTRIC",
  "LPG": "LPG",
  "CNG": "CNG",
};

const transmissionMap: Record<string, string> = {
  "Manuální": "MANUAL",
  "Automatická": "AUTOMATIC",
  "Manuál": "MANUAL",
  "Automat": "AUTOMATIC",
};

const inzerceSchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.number().int().min(1900).max(2100, "Neplatný rok výroby"),
  mileage: z.number().int().min(0, "Nájezd musí být kladné číslo"),
  fuelType: z.string().min(1, "Typ paliva je povinný"),
  transmission: z.string().min(1, "Převodovka je povinná"),
  price: z.number().int().min(0, "Cena musí být kladné číslo"),
  priceNegotiable: z.boolean().default(false),
  contactName: z.string().min(1, "Jméno kontaktní osoby je povinné"),
  contactPhone: z.string().min(9, "Telefon je povinný"),
  contactEmail: z.string().email("Neplatný formát e-mailu").optional().or(z.literal("")),
  city: z.string().min(1, "Město je povinné"),
  description: z.string().optional(),
  // Volitelná rozšířená pole
  enginePower: z.number().int().optional(),
  bodyType: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
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

function generateVinPlaceholder(): string {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  let vin = "PRIV";
  for (let i = 0; i < 13; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = inzerceSchema.parse(body);

    const slug = generateSlug(data.brand, data.model, data.year);
    const vin = generateVinPlaceholder();

    const mappedFuel = fuelTypeMap[data.fuelType] || data.fuelType;
    const mappedTransmission = transmissionMap[data.transmission] || data.transmission;

    const vehicle = await prisma.vehicle.create({
      data: {
        vin,
        vinLocked: false,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        slug,
        fuelType: mappedFuel,
        transmission: mappedTransmission,
        enginePower: data.enginePower ?? null,
        bodyType: data.bodyType ?? null,
        color: data.color ?? null,
        condition: data.condition ?? "GOOD",
        price: data.price,
        priceNegotiable: data.priceNegotiable,
        description: data.description ?? null,
        status: "ACTIVE",
        publishedAt: new Date(),
        sellerType: "private",
        brokerId: null,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || null,
        city: data.city,
      },
    });

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/inzerce error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
