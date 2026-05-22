import { prisma } from "@/lib/prisma";
import { AdminServisyTable } from "@/components/admin/autoservisy/AdminServisyTable";

export const dynamic = "force-dynamic";

export default async function AdminServisyPage() {
  const [servisy, pendingCounts] = await Promise.all([
    prisma.autoServis.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.servisReview.groupBy({
      by: ["servisId"],
      where: { isPublished: false },
      _count: true,
    }),
  ]);

  const pendingMap = new Map(pendingCounts.map((p) => [p.servisId, p._count]));

  const serialized = servisy.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    city: s.city,
    tier: s.tier,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    isVerified: s.isVerified,
    isClaimed: s.isClaimed,
    isPublished: s.isPublished,
    isFeatured: s.isFeatured,
    insurancePartner: s.insurancePartner,
    pendingReviews: pendingMap.get(s.id) ?? 0,
    createdAt: s.createdAt.toISOString(),
  }));

  return <AdminServisyTable initialServisy={serialized} />;
}
