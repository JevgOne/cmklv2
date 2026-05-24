import { prisma } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/seo-audit";
import { SeoAuditRunner } from "@/components/admin/seo/SeoAuditRunner";

export const dynamic = "force-dynamic";

export default async function SeoAuditPage() {
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

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span>SEO</span>
          <span>/</span>
          <span className="text-gray-900">Audit</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">SEO Audit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Spusťte automatický audit a opravte nalezené problémy
        </p>
      </div>

      <SeoAuditRunner initialResult={audit} />
    </div>
  );
}
