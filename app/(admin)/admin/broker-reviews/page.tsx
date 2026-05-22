import { prisma } from "@/lib/prisma";
import { BrokerReviewsManager } from "@/components/admin/BrokerReviewsManager";

export default async function AdminBrokerReviewsPage() {
  const reviews = await prisma.brokerReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      broker: { select: { firstName: true, lastName: true, slug: true } },
    },
  });

  const serialized = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recenze makléřů</h1>
      <BrokerReviewsManager initialReviews={serialized} />
    </div>
  );
}
