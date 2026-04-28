import type { Metadata } from "next";
import { generateAggregateRatingJsonLd } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 3600;

// Canonical exportujeme na layout level (kontrolovaná výjimka pravidla Q5):
// /recenze/page.tsx NEMŮŽE exportovat vlastní `metadata` vedle server component data fetch.
// Single-page subtree → layout-level canonical bez rizika inheritance leak-u.
export const metadata: Metadata = {
  title: "Recenze",
  description:
    "Přečtěte si recenze spokojených klientů CarMakléř. Skutečné zkušenosti prodejců i kupujících.",
  openGraph: {
    title: "Recenze klientů | CarMakléř",
    description:
      "Skutečné zkušenosti prodejců i kupujících. Přečtěte si hodnocení od našich klientů.",
  },
  alternates: pageCanonical("/recenze"),
};

export default async function RecenzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    select: { rating: true, authorName: true, text: true },
  }).catch(() => []);

  if (reviews.length === 0) {
    return <>{children}</>;
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const topReviews = reviews
    .filter((r) => r.rating >= 4)
    .slice(0, 3)
    .map((r) => ({
      author: r.authorName,
      reviewBody: r.text.length > 200 ? r.text.slice(0, 200) + "…" : r.text,
      ratingValue: r.rating,
    }));

  const reviewJsonLdStr = generateAggregateRatingJsonLd({
    organizationName: "CarMakléř",
    ratingValue: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    reviews: topReviews,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: reviewJsonLdStr }}
      />
      {children}
    </>
  );
}
