import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assignRegionByCity } from "@/lib/lead-management";

const sellRequestSchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.union([z.string(), z.number()]).transform(String),
  mileage: z.union([z.string(), z.number()]).transform(String),
  fuelType: z.string().min(1, "Typ paliva je povinný"),
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email"),
  city: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sellRequestSchema.parse(body);

    // Auto-assign region by city
    const regionId = data.city
      ? await assignRegionByCity(data.city)
      : null;

    // Create Lead record
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        brand: data.brand,
        model: data.model,
        year: parseInt(data.year, 10) || null,
        mileage: parseInt(data.mileage, 10) || null,
        description: data.note || null,
        city: data.city || null,
        regionId,
        source: "WEB_FORM",
        status: "NEW",
      },
    });

    console.log("Nový požadavek na prodej (lead ID: %s):", lead.id, {
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      fuelType: data.fuelType,
      name: data.name,
      phone: data.phone,
      email: data.email,
      note: data.note,
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sell request error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
