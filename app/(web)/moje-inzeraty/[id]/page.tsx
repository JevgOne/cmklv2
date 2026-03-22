"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";

interface ListingDetail {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  price: number;
  priceNegotiable: boolean;
  fuelType: string;
  transmission: string;
  status: string;
  viewCount: number;
  inquiryCount: number;
  description: string | null;
  city: string;
  district: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  isPremium: boolean;
  createdAt: string;
  publishedAt: string | null;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  inquiries: InquiryItem[];
}

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  read: boolean;
  createdAt: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type StatusVariant = "active" | "pending" | "rejected" | "draft" | "sold";

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "ACTIVE": return "active";
    case "DRAFT": return "draft";
    case "SOLD": return "sold";
    default: return "pending";
  }
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const [listingRes, inquiriesRes] = await Promise.all([
        fetch(`/api/listings/${id}`),
        fetch(`/api/listings/${id}/inquiry`),
      ]);

      if (listingRes.ok) {
        const listingData = await listingRes.json();
        const detail = listingData.listing || listingData;

        let inquiries: InquiryItem[] = [];
        if (inquiriesRes.ok) {
          const inquiryData = await inquiriesRes.json();
          inquiries = inquiryData.inquiries || [];
        }

        setListing({ ...detail, inquiries });
      }
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (inquiryId: string) => {
    const text = replyText[inquiryId]?.trim();
    if (!text) return;

    setReplyLoading(inquiryId);
    try {
      const res = await fetch(`/api/listings/${id}/inquiry/${inquiryId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text }),
      });

      if (res.ok) {
        setReplyText((prev) => ({ ...prev, [inquiryId]: "" }));
        fetchListing();
      }
    } catch {
      // silently fail
    } finally {
      setReplyLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Inzerát nenalezen</h2>
        <Link href="/moje-inzeraty" className="text-orange-500 mt-4 block">
          Zpět na moje inzeráty
        </Link>
      </div>
    );
  }

  const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none mb-2 block"
          >
            &larr; Zpět na seznam
          </button>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {listing.brand} {listing.model} {listing.variant || ""}
          </h2>
        </div>
        <StatusPill variant={getStatusVariant(listing.status)}>
          {listing.status}
        </StatusPill>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<span>&#128065;</span>}
          iconColor="blue"
          value={String(listing.viewCount)}
          label="Zobrazení"
        />
        <StatCard
          icon={<span>&#128172;</span>}
          iconColor="green"
          value={String(listing.inquiryCount)}
          label="Dotazů"
        />
        <StatCard
          icon={<span>&#128176;</span>}
          iconColor="orange"
          value={formatPrice(listing.price)}
          label="Cena"
        />
        <StatCard
          icon={<span>&#128197;</span>}
          value={listing.publishedAt ? formatDate(listing.publishedAt) : "---"}
          label="Publikováno"
        />
      </div>

      {/* Photos */}
      {listing.images && listing.images.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {listing.images
              .sort((a, b) => a.order - b.order)
              .map((img, index) => (
                <div
                  key={img.id}
                  className={`relative aspect-[4/3] bg-gray-100 ${
                    index === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {img.isPrimary && (
                    <Badge variant="top" className="absolute top-2 left-2">
                      Hlavní
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Listing info */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detail inzerátu</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <InfoRow label="Rok" value={String(listing.year)} />
          <InfoRow label="Nájezd" value={`${new Intl.NumberFormat("cs-CZ").format(listing.mileage)} km`} />
          <InfoRow label="Palivo" value={listing.fuelType} />
          <InfoRow label="Převodovka" value={listing.transmission} />
          <InfoRow label="Město" value={listing.city} />
          <InfoRow label="Cena" value={`${formatPrice(listing.price)}${listing.priceNegotiable ? " (k jednání)" : ""}`} />
        </div>
        {listing.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
          </div>
        )}
      </Card>

      {/* Inquiries */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Dotazy ({listing.inquiries?.length || 0})
        </h3>

        {(!listing.inquiries || listing.inquiries.length === 0) ? (
          <p className="text-sm text-gray-500">Zatím žádné dotazy.</p>
        ) : (
          <div className="space-y-4">
            {listing.inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {inquiry.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {inquiry.email} &middot; {formatDate(inquiry.createdAt)}
                    </span>
                  </div>
                  {!inquiry.read && (
                    <Badge variant="new">Nový</Badge>
                  )}
                </div>

                <p className="text-sm text-gray-700 mt-2">{inquiry.message}</p>

                {inquiry.reply ? (
                  <div className="mt-3 pl-4 border-l-2 border-orange-200">
                    <span className="text-xs text-gray-500">Vaše odpověď:</span>
                    <p className="text-sm text-gray-700 mt-1">{inquiry.reply}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Textarea
                      placeholder="Napište odpověď..."
                      value={replyText[inquiry.id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [inquiry.id]: e.target.value }))
                      }
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReply(inquiry.id)}
                        disabled={replyLoading === inquiry.id || !replyText[inquiry.id]?.trim()}
                      >
                        {replyLoading === inquiry.id ? "Odesílám..." : "Odpovědět"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}
