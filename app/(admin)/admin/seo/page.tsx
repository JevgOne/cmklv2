import { prisma } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/seo-audit";
import { SeoHealthCards } from "@/components/admin/seo/SeoHealthCards";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeoAdminPage() {
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

  const audit = computeHealthScore(pages);

  const recentChanges = await prisma.seoPageMeta.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { pagePath: true, updatedAt: true, title: true },
  });

  const sectionCoverage = await prisma.seoPageMeta.groupBy({
    by: ["section"],
    _count: true,
    where: { auditStatus: "OK" },
  });

  const sectionTotals = await prisma.seoPageMeta.groupBy({
    by: ["section"],
    _count: true,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">SEO</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">SEO centrum</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/seo/metadata"
            className="inline-flex items-center gap-2 py-2 px-4 text-[13px] font-semibold rounded-full bg-white text-gray-800 shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50 transition-all no-underline"
          >
            Metadata
          </Link>
          <Link
            href="/admin/seo/audit"
            className="inline-flex items-center gap-2 py-2 px-4 text-[13px] font-semibold rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5 transition-all no-underline"
          >
            Spustit audit
          </Link>
        </div>
      </div>

      <SeoHealthCards
        score={audit.score}
        ok={audit.ok}
        warnings={audit.warnings}
        errors={audit.errors}
        issues={audit.issues.slice(0, 10)}
        recentChanges={recentChanges.map((c) => ({
          ...c,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        sectionCoverage={sectionCoverage.map((s) => ({
          section: s.section,
          _count: s._count,
        }))}
        sectionTotals={sectionTotals.map((s) => ({
          section: s.section,
          _count: s._count,
        }))}
      />
    </div>
  );
}
