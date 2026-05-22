"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface BrokerReview {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  recommend: boolean;
  text: string;
  transactionType: string | null;
  vehicleBrand: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: string;
  broker: { firstName: string; lastName: string; slug: string | null };
}

type FilterTab = "all" | "pending" | "published";

const TAB_LABELS: Record<FilterTab, string> = {
  all: "Všechny",
  pending: "Ke schválení",
  published: "Publikované",
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

interface Props {
  initialReviews: BrokerReview[];
}

export function BrokerReviewsManager({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<BrokerReview[]>(initialReviews);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/broker-reviews");
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  async function togglePublish(id: string, current: boolean) {
    const res = await fetch("/api/admin/broker-reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished: !current }),
    });
    if (res.ok) fetchReviews();
  }

  async function deleteReview(id: string) {
    if (!confirm("Smazat recenzi?")) return;
    const res = await fetch(`/api/admin/broker-reviews?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchReviews();
  }

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.isPublished;
    if (filter === "published") return r.isPublished;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isPublished).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Recenze makléřů
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
              {pendingCount} ke schválení
            </span>
          )}
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition cursor-pointer bg-transparent ${
              filter === tab
                ? "border-orange-500 text-orange-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Načítám...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Žádné recenze v této kategorii.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`border rounded-lg p-4 ${
                r.isPublished ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Stars count={r.rating} />
                    <span className="text-sm font-semibold text-gray-900">
                      {r.authorName}
                    </span>
                    {r.authorCity && (
                      <span className="text-xs text-gray-500">
                        ({r.authorCity})
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    Makléř:{" "}
                    <span className="font-medium text-gray-700">
                      {r.broker.firstName} {r.broker.lastName}
                    </span>
                    {r.transactionType && ` · ${r.transactionType}`}
                    {r.vehicleBrand && ` · ${r.vehicleBrand}`}
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">{r.text}</p>
                  {r.recommend && (
                    <span className="text-xs text-green-600 mt-1 inline-block">
                      Doporučuje
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={r.isPublished ? "secondary" : "primary"}
                    onClick={() => togglePublish(r.id, r.isPublished)}
                  >
                    {r.isPublished ? "Skrýt" : "Publikovat"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteReview(r.id)}
                  >
                    Smazat
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
