"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  buyer: { firstName: string | null; lastName: string | null };
}

interface SupplierReviewsProps {
  supplierId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-200"}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SupplierReviews({ supplierId }: SupplierReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/suppliers/${supplierId}/reviews?page=${page}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
          setAverageRating(data.averageRating);
          setTotalCount(data.totalCount ?? 0);
          setTotalPages(data.totalPages ?? 0);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [supplierId, page]);

  if (loading && page === 1) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (totalCount === 0 && !loading) {
    return null; // No reviews — don't render section
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-baseline gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Hodnocení zákazníků
        </h2>
        {averageRating !== null && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} />
            <span className="text-lg font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({totalCount} {totalCount === 1 ? "recenze" : "recenzí"})
            </span>
          </div>
        )}
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const buyerName =
            [review.buyer.firstName, review.buyer.lastName]
              .filter(Boolean)
              .join(" ") || "Zákazník";
          return (
            <Card key={review.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium text-gray-900">
                    {buyerName}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.text && (
                <p className="text-sm text-gray-600">{review.text}</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &larr; Novější
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Starší &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
