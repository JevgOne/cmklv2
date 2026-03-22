import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateConfigSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  format: z.enum(["SAUTO_XML", "TIPCARS_XML", "CSV"]).optional(),
  mapping: z.record(z.string(), z.string()).optional(),
  active: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/feeds/import/config/[id] — Úprava konfigurace         */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const { id } = await params;

    const config = await prisma.feedImportConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json({ error: "Konfigurace nenalezena" }, { status: 404 });
    }

    // Vlastnik nebo admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (config.userId !== session.user.id && user?.role !== "ADMIN" && user?.role !== "BACKOFFICE") {
      return NextResponse.json({ error: "Nedostatecna opravneni" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateConfigSchema.parse(body);

    const updated = await prisma.feedImportConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.format !== undefined && { format: data.format }),
        ...(data.mapping !== undefined && { mapping: JSON.stringify(data.mapping) }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return NextResponse.json({ config: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/feeds/import/config/[id] error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/feeds/import/config/[id] — Smazání konfigurace        */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const { id } = await params;

    const config = await prisma.feedImportConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json({ error: "Konfigurace nenalezena" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (config.userId !== session.user.id && user?.role !== "ADMIN" && user?.role !== "BACKOFFICE") {
      return NextResponse.json({ error: "Nedostatecna opravneni" }, { status: 403 });
    }

    await prisma.feedImportConfig.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/feeds/import/config/[id] error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}
