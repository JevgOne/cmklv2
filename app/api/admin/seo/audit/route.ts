import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditPage, computeHealthScore } from "@/lib/seo-audit";

// STOP-4: ADMIN only
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

/**
 * GET /api/admin/seo/audit — current audit results (health score + issues)
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pages = await prisma.seoPageMeta.findMany({
    select: {
      pagePath: true,
      pageType: true,
      title: true,
      description: true,
      ogTitle: true,
      noIndex: true,
      schemaTypesJson: true,
    },
  });

  const result = computeHealthScore(pages);
  return NextResponse.json(result);
}

/**
 * POST /api/admin/seo/audit — run audit and persist results
 * Body: { scope: "all" | "section", section?: string }
 *
 * STOP-3: Audit NEVER modifies metadata — only updates audit fields.
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const scope: string = body.scope || "all";
  const section: string | undefined = body.section;

  const where = scope === "section" && section ? { section } : {};

  const pages = await prisma.seoPageMeta.findMany({ where });

  let audited = 0;
  let ok = 0;
  let warnings = 0;
  let errors = 0;

  for (const page of pages) {
    const issues = auditPage(page);
    const notes = issues.map((i) => `[${i.severity}] ${i.rule}: ${i.message}`).join("\n");

    let status: string;
    if (issues.some((i) => i.severity === "ERROR")) {
      status = "ERROR";
      errors++;
    } else if (issues.length > 0) {
      status = "WARNING";
      warnings++;
    } else {
      status = "OK";
      ok++;
    }

    // STOP-3: Only update audit fields, never metadata fields
    await prisma.seoPageMeta.update({
      where: { id: page.id },
      data: {
        auditStatus: status,
        auditNotes: notes || null,
        lastAuditedAt: new Date(),
      },
    });

    audited++;
  }

  return NextResponse.json({ audited, ok, warnings, errors });
}
