import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagInput, upsertTag } from "@/lib/tags";
import { z } from "zod";

/**
 * GET /api/profile/tags
 * Auth required. Vrací tagy aktuálního uživatele.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tags: { select: { slug: true, label: true }, orderBy: { label: "asc" } },
      },
    });

    return NextResponse.json({ tags: user?.tags ?? [] });
  } catch (err) {
    console.error("GET /api/profile/tags failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const updateTagsSchema = z.object({
  tags: z
    .array(
      z.object({
        slug: z.string().min(1).max(50).optional(),
        label: z.string().min(1).max(50),
      })
    )
    .max(10, "Maximálně 10 hashtagů"),
});

/**
 * PUT /api/profile/tags
 * Auth required. Replace all tags of current user (max 10).
 * Nové labely se upsertnou jako nové `Tag` entity.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateTagsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Dedupe by slug — user může omylem poslat 2× stejný tag
    const normalizedMap = new Map<string, { slug: string; label: string }>();
    for (const t of parsed.data.tags) {
      const n = normalizeTagInput(t);
      if (!normalizedMap.has(n.slug)) normalizedMap.set(n.slug, n);
    }
    const normalized = [...normalizedMap.values()];

    // Atomická transakce: upsert všech tagů + replace user's tag set
    await prisma.$transaction(async (tx) => {
      const tags = await Promise.all(
        normalized.map((t) => upsertTag(t.slug, t.label, session.user.id, tx))
      );
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          tags: { set: tags.map((t) => ({ id: t.id })) },
        },
      });
    });

    return NextResponse.json({
      tags: normalized.map((t) => ({ slug: t.slug, label: t.label })),
    });
  } catch (err) {
    console.error("PUT /api/profile/tags failed", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
