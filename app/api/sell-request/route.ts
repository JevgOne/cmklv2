import { NextResponse } from "next/server";
import { z } from "zod";

const sellRequestSchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.union([z.string(), z.number()]).transform(String),
  mileage: z.union([z.string(), z.number()]).transform(String),
  fuelType: z.string().min(1, "Typ paliva je povinný"),
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email"),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = sellRequestSchema.parse(body);

    // Log pro teď - odesílání emailů se přidá později
    console.log("Nový požadavek na prodej:", {
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

    return NextResponse.json({ success: true });
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
