import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/watchdog — Vytvořit hlídacího psa                      */
/* ------------------------------------------------------------------ */

const watchdogSchema = z.object({
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const body = await request.json();
    const data = watchdogSchema.parse(body);

    // Max 10 hlídacích psů na uživatele
    const count = await prisma.watchdog.count({
      where: { userId: session.user.id, active: true },
    });

    if (count >= 10) {
      return NextResponse.json(
        { error: "Maximální počet hlídacích psů (10) dosažen" },
        { status: 400 }
      );
    }

    const watchdog = await prisma.watchdog.create({
      data: {
        userId: session.user.id,
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

    console.error("POST /api/watchdog error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/watchdog — Seznam hlídacích psů uživatele                */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const watchdogs = await prisma.watchdog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ watchdogs });
  } catch (error) {
    console.error("GET /api/watchdog error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/watchdog?id=xxx — Smazat hlídacího psa                */
/* ------------------------------------------------------------------ */

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const watchdogId = request.nextUrl.searchParams.get("id");
    if (!watchdogId) {
      return NextResponse.json({ error: "ID je povinné" }, { status: 400 });
    }

    const existing = await prisma.watchdog.findUnique({
      where: { id: watchdogId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
    }

    await prisma.watchdog.delete({ where: { id: watchdogId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/watchdog error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
