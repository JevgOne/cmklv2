"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

interface ReviewItem {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  authorCity: string | null;
  type: string;
  createdAt: string;
}

const tabs = [
  { value: "all", label: "Všechny" },
  { value: "SELLER", label: "Prodejci" },
  { value: "BUYER", label: "Kupující" },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < count ? "text-orange-400" : "text-gray-200"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? reviews
      : reviews.filter((r) => r.type === filter);

  return (
    <>
      {/* Tabs filter */}
      <div className="flex justify-center mb-10">
        <Tabs
          tabs={tabs}
          defaultTab="all"
          onTabChange={(val) => setFilter(val)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filtered.map((review) => (
          <Card key={review.id} hover className="p-6">
            <Stars count={review.rating} />
            <p className="text-gray-700 italic leading-relaxed mt-4">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold text-gray-900 text-sm">
                  {review.authorName}
                </span>
                {review.authorCity && (
                  <span className="text-gray-500 text-sm">
                    , {review.authorCity}
                  </span>
                )}
                <span className="text-gray-500 text-sm">
                  {" "}· {formatDate(review.createdAt)}
                </span>
              </div>
              <Badge variant={review.type === "SELLER" ? "verified" : "new"}>
                {review.type === "SELLER" ? "Ověřený prodej" : review.type === "BUYER" ? "Ověřený nákup" : "Recenze"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8">Žádné recenze v této kategorii.</p>
      )}
    </>
  );
}
