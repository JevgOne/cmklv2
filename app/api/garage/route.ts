import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MAX_CARS_PER_USER = 5;

const createCarSchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().max(17).optional(),
  nickname: z.string().max(50).optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/garage — Přidat auto do garáže                           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const data = createCarSchema.parse(body);

    // Max 5 aut per user
    const count = await prisma.customerGarage.count({
      where: { userId: session.user.id },
    });
    if (count >= MAX_CARS_PER_USER) {
      return NextResponse.json(
        { error: `Maximální počet uložených aut je ${MAX_CARS_PER_USER}` },
        { status: 400 },
      );
    }

    const isFirst = count === 0;

    const car = await prisma.customerGarage.create({
      data: {
        userId: session.user.id,
        brand: data.brand,
        model: data.model,
        year: data.year ?? null,
        vin: data.vin ?? null,
        nickname: data.nickname ?? null,
        isDefault: isFirst, // první auto = default
      },
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    // Unique constraint (userId, vin)
    if ((error as Record<string, string>)?.code === "P2002") {
      return NextResponse.json(
        { error: "Auto s tímto VIN už máte v garáži" },
        { status: 409 },
      );
    }
    console.error("POST /api/garage error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/garage — Seznam aut v garáži                              */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const cars = await prisma.customerGarage.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ cars });
  } catch (error) {
    console.error("GET /api/garage error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
