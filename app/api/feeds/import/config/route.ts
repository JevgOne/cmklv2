import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createConfigSchema = z.object({
  name: z.string().min(1, "Nazev je povinny"),
  url: z.string().url("Neplatna URL"),
  format: z.enum(["SAUTO_XML", "TIPCARS_XML", "CSV"]),
  mapping: z.record(z.string(), z.string()).optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/feeds/import/config — Vytvoření konfigurace feedu       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    // Povolit jen ADVERTISER, ADMIN, BACKOFFICE
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, accountType: true },
    });

    const isAllowed =
      user?.role === "ADMIN" ||
      user?.role === "BACKOFFICE" ||
      user?.accountType === "DEALER" ||
      user?.accountType === "BAZAAR";

    if (!isAllowed) {
      return NextResponse.json({ error: "Nedostatecna opravneni" }, { status: 403 });
    }

    const body = await request.json();
    const data = createConfigSchema.parse(body);

    const config = await prisma.feedImportConfig.create({
      data: {
        userId: session.user.id,
        name: data.name,
        url: data.url,
        format: data.format,
        mapping: data.mapping ? JSON.stringify(data.mapping) : null,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/feeds/import/config error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/feeds/import/config — Seznam konfigurací                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // ADMIN vidi vsechny, ostatni jen vlastni
    const where =
      user?.role === "ADMIN" || user?.role === "BACKOFFICE"
        ? {}
        : { userId: session.user.id };

    const configs = await prisma.feedImportConfig.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
      },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("GET /api/feeds/import/config error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
