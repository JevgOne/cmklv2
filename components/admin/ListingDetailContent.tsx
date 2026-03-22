"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
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
  listingType: string;
  status: string;
  isPremium: boolean;
  flagCount: number;
  viewCount: number;
  inquiryCount: number;
  description: string | null;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  createdAt: string;
  publishedAt: string | null;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  flags: FlagItem[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string | null;
    accountType: string | null;
  };
}

interface FlagItem {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
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

const flagReasonLabels: Record<string, string> = {
  FAKE: "Podvodný inzerát",
  WRONG_INFO: "Chybné informace",
  DUPLICATE: "Duplicitní inzerát",
  SOLD: "Již prodáno",
  OFFENSIVE: "Nevhodný obsah",
  OTHER: "Jiný důvod",
};

export function ListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data.listing || data);
      }
    } catch {
      // handled by loading state
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject" | "deactivate") => {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { action };
      if (action === "reject" && rejectionReason) {
        body.reason = rejectionReason;
      }

      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchListing();
        setShowRejectForm(false);
        setRejectionReason("");
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
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
        <Button variant="ghost" onClick={() => router.push("/admin/inzerce")} className="mt-4">
          Zpět na seznam
        </Button>
      </div>
    );
  }

  const sellerName = listing.user.companyName || `${listing.user.firstName} ${listing.user.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/inzerce")}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-none mb-2 block"
          >
            &larr; Zpět na seznam
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {listing.brand} {listing.model} {listing.variant || ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ID: {listing.id} · Slug: {listing.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={listing.status === "ACTIVE" ? "verified" : listing.status === "DRAFT" ? "pending" : "default"}>
            {listing.status}
          </Badge>
          {listing.flagCount > 0 && (
            <Badge variant="rejected">{listing.flagCount}x nahlášen</Badge>
          )}
        </div>
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
          value={listing.publishedAt ? formatDate(listing.publishedAt) : "Nepublikováno"}
          label="Publikováno"
        />
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Moderační akce</h3>
        <div className="flex flex-wrap gap-3">
          {listing.status === "DRAFT" && (
            <Button
              variant="success"
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
            >
              Schválit a publikovat
            </Button>
          )}
          {(listing.status === "DRAFT" || listing.status === "ACTIVE") && (
            <Button
              variant="danger"
              onClick={() => setShowRejectForm(true)}
              disabled={actionLoading}
            >
              Zamítnout
            </Button>
          )}
          {listing.status === "ACTIVE" && (
            <Button
              variant="outline"
              onClick={() => handleAction("deactivate")}
              disabled={actionLoading}
            >
              Deaktivovat
            </Button>
          )}
        </div>

        {showRejectForm && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl">
            <Textarea
              label="Důvod zamítnutí"
              placeholder="Uveďte důvod zamítnutí inzerátu..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2 mt-3">
              <Button variant="danger" size="sm" onClick={() => handleAction("reject")} disabled={actionLoading}>
                {actionLoading ? "Zamítám..." : "Potvrdit zamítnutí"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>
                Zrušit
              </Button>
            </div>
          </div>
        )}
      </Card>

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
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Listing info */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detail inzerátu</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <InfoRow label="Typ" value={listing.listingType} />
          <InfoRow label="Rok" value={String(listing.year)} />
          <InfoRow label="Nájezd" value={`${new Intl.NumberFormat("cs-CZ").format(listing.mileage)} km`} />
          <InfoRow label="Město" value={listing.city} />
          <InfoRow label="Premium" value={listing.isPremium ? "Ano" : "Ne"} />
          <InfoRow label="Vytvořeno" value={formatDate(listing.createdAt)} />
        </div>
        {listing.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
          </div>
        )}
      </Card>

      {/* Inzerent info */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Inzerent</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Jméno" value={sellerName} />
          <InfoRow label="Email" value={listing.user.email} />
          <InfoRow label="Typ účtu" value={listing.user.accountType || "—"} />
          <InfoRow label="Kontakt inzerátu" value={listing.contactPhone} />
        </div>
      </Card>

      {/* Flags */}
      {listing.flags && listing.flags.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Nahlášení ({listing.flags.length})
          </h3>
          <div className="space-y-3">
            {listing.flags.map((flag) => (
              <div key={flag.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={flag.resolvedAt ? "default" : "rejected"}>
                    {flag.resolvedAt ? "Vyřešeno" : "Nevyřešeno"}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatDate(flag.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {flagReasonLabels[flag.reason] || flag.reason}
                </p>
                {flag.details && (
                  <p className="text-sm text-gray-600 mt-1">{flag.details}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
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
