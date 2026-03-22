"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface InquiryItem {
  id: string;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  read: boolean;
  createdAt: string;
  listing: {
    id: string;
    slug: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    price: number;
    images: { url: string; isPrimary: boolean }[];
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function DotazyPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await fetch("/api/buyer/inquiries");
        if (res.ok) {
          const data = await res.json();
          setInquiries(data.inquiries || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <EmptyState
        icon="&#128172;"
        title="Zatím jste neodeslali žádné dotazy"
        description="Při procházení nabídky můžete poslat dotaz prodejci."
        actionLabel="Prohlédnout nabídku"
        onAction={() => window.location.href = "/nabidka"}
      />
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Moje dotazy ({inquiries.length})
      </h2>

      <div className="space-y-4">
        {inquiries.map((inquiry) => {
          const listing = inquiry.listing;
          const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];

          return (
            <Card key={inquiry.id} className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Listing thumbnail */}
                <div className="sm:w-40 shrink-0">
                  <Link href={`/inzerce/katalog/${listing.slug}`} className="block no-underline">
                    <div className="aspect-[4/3] sm:h-full bg-gray-100">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={`${listing.brand} ${listing.model}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                          &#128247;
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/inzerce/katalog/${listing.slug}`}
                        className="font-bold text-gray-900 text-sm no-underline hover:text-orange-500 transition-colors"
                      >
                        {listing.brand} {listing.model} {listing.variant || ""}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {listing.year} &middot; {formatPrice(listing.price)}
                      </p>
                    </div>
                    <Badge variant={inquiry.reply ? "verified" : "pending"}>
                      {inquiry.reply ? "Odpovězeno" : "Čeká na odpověď"}
                    </Badge>
                  </div>

                  {/* My message */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                      Váš dotaz ({formatDate(inquiry.createdAt)})
                    </span>
                    <p className="text-sm text-gray-700 mt-1">{inquiry.message}</p>
                  </div>

                  {/* Reply */}
                  {inquiry.reply && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg border-l-3 border-orange-400">
                      <span className="text-[11px] text-orange-500 font-medium uppercase tracking-wide">
                        Odpověď prodejce ({inquiry.repliedAt ? formatDate(inquiry.repliedAt) : ""})
                      </span>
                      <p className="text-sm text-gray-700 mt-1">{inquiry.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
