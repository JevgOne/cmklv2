import { prisma } from "@/lib/prisma";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    authorCity: r.authorCity,
    text: r.text,
    rating: r.rating,
    type: r.type,
    isPublished: r.isPublished,
    isFeatured: r.isFeatured,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
  }));

  return <ReviewsManager initialReviews={serialized} />;
}
