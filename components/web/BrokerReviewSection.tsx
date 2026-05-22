"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BrokerRatingSummary } from "./BrokerRatingSummary";
import { BrokerReviewCard } from "./BrokerReviewCard";
import { BrokerReviewForm } from "./BrokerReviewForm";

interface BrokerReviewData {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  recommend: boolean;
  text: string;
  transactionType: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  isVerified: boolean;
  ratingCommunication: number | null;
  ratingSpeed: number | null;
  ratingFairness: number | null;
  ratingProfessionalism: number | null;
  createdAt: string;
}

interface BreakdownItem {
  stars: number;
  count: number;
  percentage: number;
}

interface DetailedRatings {
  communication: number | null;
  speed: number | null;
  fairness: number | null;
  professionalism: number | null;
}

interface Props {
  brokerId: string;
  brokerSlug: string;
  brokerName: string;
  avgRating: number;
  reviewCount: number;
  recommendRate: number;
  reviews: BrokerReviewData[];
  breakdown: BreakdownItem[];
  detailedRatings: DetailedRatings;
}

export function BrokerReviewSection({
  brokerSlug,
  brokerName,
  avgRating,
  reviewCount,
  recommendRate,
  reviews: initialReviews,
  breakdown,
  detailedRatings,
}: Props) {
  const [reviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          Hodnocení od klientů
        </h2>
        {!showForm && !success && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            Napsat recenzi
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
          Děkujeme za recenzi! Bude zveřejněna po schválení administrátorem.
        </div>
      )}

      {/* Rating summary */}
      {reviewCount > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-100">
          <BrokerRatingSummary
            avgRating={avgRating}
            reviewCount={reviewCount}
            recommendRate={recommendRate}
            breakdown={breakdown}
            detailedRatings={detailedRatings}
          />
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mb-6">
          <BrokerReviewForm
            brokerSlug={brokerSlug}
            brokerName={brokerName}
            onSuccess={() => {
              setSuccess(true);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <BrokerReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-gray-400 text-center py-8">
            Zatím žádné recenze. Buďte první, kdo ohodnotí tohoto makléře!
          </p>
        )
      )}
    </Card>
  );
}
