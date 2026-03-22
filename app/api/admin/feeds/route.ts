import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFeedConfigSchema } from "@/lib/validators/feeds";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  GET /api/admin/feeds — Seznam feed konfigurací                     */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const feeds = await prisma.partsFeedConfig.findMany({
      include: {
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
        _count: { select: { parts: true, importLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feeds });
  } catch (error) {
    console.error("GET /api/admin/feeds error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/feeds — Vytvoření feed konfigurace                 */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = createFeedConfigSchema.parse(body);

    // Ověř, že supplier existuje
    const supplier = await prisma.user.findUnique({
      where: { id: data.supplierId },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Dodavatel nenalezen" }, { status: 404 });
    }

    const feed = await prisma.partsFeedConfig.create({
      data: {
        supplierId: data.supplierId,
        name: data.name,
        feedUrl: data.feedUrl,
        feedFormat: data.feedFormat,
        fieldMapping: data.fieldMapping ? JSON.stringify(data.fieldMapping) : null,
        updateFrequency: data.updateFrequency,
        markupType: data.markupType,
        markupValue: data.markupValue,
        categoryMarkups: data.categoryMarkups ? JSON.stringify(data.categoryMarkups) : null,
        defaultPartType: data.defaultPartType,
        isActive: data.isActive,
      },
      include: {
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
    });

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/admin/feeds error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
