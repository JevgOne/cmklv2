import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/watchdog/email — Vytvořit hlídacího psa bez registrace  */
/* ------------------------------------------------------------------ */

const emailWatchdogSchema = z.object({
  email: z.string().email("Neplatný email"),
  brand: z.string().optional(),
  model: z.string().optional(),
  minPrice: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  minYear: z.number().int().optional(),
  maxYear: z.number().int().optional(),
  fuelType: z.string().optional(),
  bodyType: z.string().optional(),
  city: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = emailWatchdogSchema.parse(body);

    // Max 5 watchdogů na email (ochrana proti spamu)
    const existingCount = await prisma.watchdog.count({
      where: { email: data.email, active: true },
    });

    if (existingCount >= 5) {
      return NextResponse.json(
        { error: "Maximální počet hlídacích psů (5) pro tento email dosažen" },
        { status: 400 }
      );
    }

    const watchdog = await prisma.watchdog.create({
      data: {
        email: data.email,
        brand: data.brand ?? null,
        model: data.model ?? null,
        minPrice: data.minPrice ?? null,
        maxPrice: data.maxPrice ?? null,
        minYear: data.minYear ?? null,
        maxYear: data.maxYear ?? null,
        fuelType: data.fuelType ?? null,
        bodyType: data.bodyType ?? null,
        city: data.city ?? null,
      },
    });

    return NextResponse.json({ watchdog }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/watchdog/email error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
