import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateFeedConfigSchema } from "@/lib/validators/feeds";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];
const DESTRUCTIVE_ROLES = ["ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  GET /api/admin/feeds/[id] — Detail feed konfigurace                */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const feed = await prisma.partsFeedConfig.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
        _count: { select: { parts: true, importLogs: true } },
        importLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!feed) {
      return NextResponse.json({ error: "Feed nenalezen" }, { status: 404 });
    }

    return NextResponse.json({ feed });
  } catch (error) {
    console.error("GET /api/admin/feeds/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/feeds/[id] — Aktualizace feed konfigurace         */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateFeedConfigSchema.parse(body);

    const existing = await prisma.partsFeedConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Feed nenalezen" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.feedUrl !== undefined) updateData.feedUrl = data.feedUrl;
    if (data.feedFormat !== undefined) updateData.feedFormat = data.feedFormat;
    if (data.fieldMapping !== undefined) updateData.fieldMapping = JSON.stringify(data.fieldMapping);
    if (data.updateFrequency !== undefined) updateData.updateFrequency = data.updateFrequency;
    if (data.markupType !== undefined) updateData.markupType = data.markupType;
    if (data.markupValue !== undefined) updateData.markupValue = data.markupValue;
    if (data.categoryMarkups !== undefined) updateData.categoryMarkups = JSON.stringify(data.categoryMarkups);
    if (data.defaultPartType !== undefined) updateData.defaultPartType = data.defaultPartType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;

    const feed = await prisma.partsFeedConfig.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
      },
    });

    return NextResponse.json({ feed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/feeds/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/feeds/[id] — Smazání feed konfigurace            */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !DESTRUCTIVE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.partsFeedConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Feed nenalezen" }, { status: 404 });
    }

    // Smaž feed konfiguraci (importLogs se smažou kaskádově)
    await prisma.partsFeedConfig.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/feeds/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}
