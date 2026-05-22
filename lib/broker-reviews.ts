import { prisma } from "@/lib/prisma";

export async function recalculateBrokerRatings(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: { rating: true, recommend: true },
  });

  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const recommendRate = count > 0
    ? (reviews.filter((r) => r.recommend).length / count) * 100
    : 0;

  await prisma.user.update({
    where: { id: brokerId },
    data: {
      brokerAvgRating: Math.round(avg * 10) / 10,
      brokerReviewCount: count,
      brokerRecommendRate: Math.round(recommendRate),
    },
  });
}

export async function getBrokerRatingBreakdown(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: { rating: true },
  });

  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return {
      stars,
      count,
      percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
    };
  });
}

export async function getBrokerDetailedRatings(brokerId: string) {
  const reviews = await prisma.brokerReview.findMany({
    where: { brokerId, isPublished: true },
    select: {
      ratingCommunication: true,
      ratingSpeed: true,
      ratingFairness: true,
      ratingProfessionalism: true,
    },
  });

  function avg(values: (number | null)[]) {
    const valid = values.filter((v): v is number => v !== null);
    return valid.length > 0
      ? Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 10) / 10
      : null;
  }

  return {
    communication: avg(reviews.map((r) => r.ratingCommunication)),
    speed: avg(reviews.map((r) => r.ratingSpeed)),
    fairness: avg(reviews.map((r) => r.ratingFairness)),
    professionalism: avg(reviews.map((r) => r.ratingProfessionalism)),
  };
}
