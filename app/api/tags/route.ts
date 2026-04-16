import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagInput, upsertTag } from "@/lib/tags";
import { z } from "zod";

/**
 * GET /api/tags?q=<search>&featured=<bool>
 * Public — autocomplete pro TagInput + featured panel pro homepage.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const featuredOnly = searchParams.get("featured") === "true";

    const where: {
      isFeatured?: boolean;
      OR?: Array<
        | { slug: { contains: string; mode: "insensitive" } }
        | { label: { contains: string; mode: "insensitive" } }
      >;
    } = {};

    if (featuredOnly) where.isFeatured = true;
    if (q) {
      where.OR = [
        { slug: { contains: q, mode: "insensitive" } },
        { label: { contains: q, mode: "insensitive" } },
      ];
    }

    const tags = await prisma.tag.findMany({
      where,
      select: {
        slug: true,
        label: true,
        isFeatured: true,
        _count: {
          select: {
            users: { where: { role: "BROKER", status: "ACTIVE" } },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { label: "asc" }],
      take: 20,
    });

    return NextResponse.json({
      tags: tags.map((t) => ({
        slug: t.slug,
        label: t.label,
        isFeatured: t.isFeatured,
        brokerCount: t._count.users,
      })),
    });
  } catch (err) {
    console.error("GET /api/tags failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const createTagSchema = z.object({
  slug: z.string().min(1).max(50).optional(),
  label: z.string().min(1).max(50),
});

/**
 * POST /api/tags
 * Auth required. Vytvoří (upsertne) nový tag. Použito z TagInput create-new flow.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalized = normalizeTagInput(parsed.data);
    const tag = await upsertTag(
      normalized.slug,
      normalized.label,
      session.user.id
    );

    return NextResponse.json({
      tag: { slug: tag.slug, label: tag.label, category: tag.category },
    });
  } catch (err) {
    console.error("POST /api/tags failed", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
