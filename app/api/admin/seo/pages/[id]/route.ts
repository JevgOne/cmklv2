import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// STOP-4: ADMIN only
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

const updateSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  canonical: z.string().max(500).nullable().optional(),
  noIndex: z.boolean().optional(),
  ogTitle: z.string().max(200).nullable().optional(),
  ogDescription: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().max(1000).nullable().optional(),
  // STOP-8: schemaTypesJson is read-only in admin (edited in code, tracked in DB)
  auditStatus: z.enum(["OK", "WARNING", "ERROR"]).nullable().optional(),
  auditNotes: z.string().max(2000).nullable().optional(),
});

/**
 * GET /api/admin/seo/pages/[id] — single page detail
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const record = await prisma.seoPageMeta.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }

  return NextResponse.json(record);
}

/**
 * PATCH /api/admin/seo/pages/[id] — update metadata fields
 * STOP-1: Only updates fields explicitly sent by admin.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const record = await prisma.seoPageMeta.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

/**
 * DELETE /api/admin/seo/pages/[id] — remove override (reverts to code defaults)
 * STOP-2: This deletes the DB override, NOT the page itself.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.seoPageMeta.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}
