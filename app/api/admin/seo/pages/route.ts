import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// STOP-4: ADMIN only
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

const createSchema = z.object({
  pagePath: z.string().min(1).max(500),
  pageType: z.enum(["STATIC", "DYNAMIC_LIST", "DYNAMIC_DETAIL", "LP"]),
  section: z.string().min(1).max(50),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  canonical: z.string().max(500).nullable().optional(),
  noIndex: z.boolean().optional(),
  ogTitle: z.string().max(200).nullable().optional(),
  ogDescription: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().max(1000).nullable().optional(),
  schemaTypesJson: z.string().max(1000).nullable().optional(),
});

// Bulk action schema (§8.3)
const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
  action: z.enum(["SET_NO_INDEX", "REMOVE_NO_INDEX", "MARK_OK", "DELETE"]),
});

/**
 * GET /api/admin/seo/pages?section=vehicles&status=WARNING&pageType=LP&page=1&limit=20&q=nabidka&sort=pagePath&order=asc
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10)));
  const section = sp.get("section");
  const status = sp.get("status");
  const pageType = sp.get("pageType");
  const q = sp.get("q");
  const sort = sp.get("sort") || "pagePath";
  const order = sp.get("order") === "desc" ? "desc" : "asc";

  const where: Prisma.SeoPageMetaWhereInput = {};
  if (section) where.section = section;
  if (pageType) where.pageType = pageType;
  if (status) {
    if (status === "unaudited") {
      where.auditStatus = null;
    } else {
      where.auditStatus = status;
    }
  }
  if (q) {
    where.OR = [
      { pagePath: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const allowedSorts = ["pagePath", "title", "section", "pageType", "auditStatus", "updatedAt"];
  const orderBy = allowedSorts.includes(sort)
    ? { [sort]: order }
    : { pagePath: order as Prisma.SortOrder };

  const [pages, total] = await Promise.all([
    prisma.seoPageMeta.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seoPageMeta.count({ where }),
  ]);

  return NextResponse.json({ pages, total, page, limit });
}

/**
 * POST /api/admin/seo/pages — create new override
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check for duplicate pagePath
  const existing = await prisma.seoPageMeta.findUnique({
    where: { pagePath: parsed.data.pagePath },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Stránka s touto cestou již existuje", existingId: existing.id },
      { status: 409 },
    );
  }

  const record = await prisma.seoPageMeta.create({ data: parsed.data });
  return NextResponse.json(record, { status: 201 });
}

/**
 * PATCH /api/admin/seo/pages — bulk actions (§8.3)
 */
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ids, action } = parsed.data;

  switch (action) {
    case "SET_NO_INDEX":
      await prisma.seoPageMeta.updateMany({
        where: { id: { in: ids } },
        data: { noIndex: true },
      });
      break;
    case "REMOVE_NO_INDEX":
      await prisma.seoPageMeta.updateMany({
        where: { id: { in: ids } },
        data: { noIndex: false },
      });
      break;
    case "MARK_OK":
      await prisma.seoPageMeta.updateMany({
        where: { id: { in: ids } },
        data: { auditStatus: "OK", lastAuditedAt: new Date() },
      });
      break;
    case "DELETE":
      await prisma.seoPageMeta.deleteMany({
        where: { id: { in: ids } },
      });
      break;
  }

  return NextResponse.json({ success: true, action, count: ids.length });
}
