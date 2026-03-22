"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";

interface Listing {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  status: string;
  viewCount: number;
  inquiryCount: number;
  isPremium: boolean;
  createdAt: string;
  images: { url: string; isPrimary: boolean }[];
}

const statusTabs = [
  { value: "all", label: "Všechny" },
  { value: "ACTIVE", label: "Aktivní" },
  { value: "DRAFT", label: "Koncepty" },
  { value: "SOLD", label: "Prodané" },
  { value: "INACTIVE", label: "Neaktivní" },
];

type StatusVariant = "active" | "pending" | "rejected" | "draft" | "sold";

function getStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "ACTIVE": return "active";
    case "DRAFT": return "draft";
    case "SOLD": return "sold";
    case "INACTIVE": return "rejected";
    case "EXPIRED": return "rejected";
    default: return "pending";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE": return "Aktivní";
    case "DRAFT": return "Koncept";
    case "SOLD": return "Prodáno";
    case "INACTIVE": return "Neaktivní";
    case "EXPIRED": return "Expirováno";
    default: return status;
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function MojeInzeratyPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings/my");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    setActionLoading(true);
    try {
      if (action === "delete") {
        await fetch(`/api/listings/${id}`, { method: "DELETE" });
        setListings((prev) => prev.filter((l) => l.id !== id));
        setDeleteModal(null);
      } else if (action === "deactivate") {
        await fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "INACTIVE" }),
        });
        fetchListings();
      } else if (action === "activate") {
        await fetch(`/api/listings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        fetchListings();
      } else if (action === "premium") {
        await fetch(`/api/listings/${id}/promote`, { method: "POST" });
        fetchListings();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = activeTab === "all"
    ? listings
    : listings.filter((l) => l.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Tabs tabs={statusTabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <Link href="/inzerce/pridat" className="no-underline hidden sm:block">
          <Button variant="primary">+ Nový inzerát</Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="&#128203;"
          title={activeTab === "all" ? "Zatím nemáte žádné inzeráty" : "Žádné inzeráty v této kategorii"}
          description="Vložte svůj první inzerát a začněte prodávat."
          actionLabel="Vložit inzerát"
          onAction={() => window.location.href = "/inzerce/pridat"}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => {
            const primaryImage = listing.images?.find((img) => img.isPrimary) || listing.images?.[0];
            return (
              <Card key={listing.id} hover className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-48 md:w-56 shrink-0">
                    <div className="aspect-[4/3] sm:h-full bg-gray-100 relative">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={`${listing.brand} ${listing.model}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                          &#128247;
                        </div>
                      )}
                      {listing.isPremium && (
                        <span className="absolute top-2 left-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          TOP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/moje-inzeraty/${listing.id}`}
                          className="text-lg font-bold text-gray-900 no-underline hover:text-orange-500 transition-colors truncate block"
                        >
                          {listing.brand} {listing.model} {listing.variant || ""}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{listing.year}</p>
                      </div>
                      <StatusPill variant={getStatusVariant(listing.status)}>
                        {getStatusLabel(listing.status)}
                      </StatusPill>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span title="Zobrazení">&#128065; {listing.viewCount}</span>
                      <span title="Dotazy">&#128172; {listing.inquiryCount}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <span className="text-xl font-extrabold text-gray-900">
                        {formatPrice(listing.price)}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link href={`/moje-inzeraty/${listing.id}`} className="no-underline">
                          <Button variant="outline" size="sm">Editovat</Button>
                        </Link>
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="sm" icon>
                              &#8942;
                            </Button>
                          }
                          items={[
                            ...(listing.status === "ACTIVE"
                              ? [{ label: "Deaktivovat", onClick: () => handleAction(listing.id, "deactivate") }]
                              : []),
                            ...(listing.status === "INACTIVE" || listing.status === "DRAFT"
                              ? [{ label: "Aktivovat", onClick: () => handleAction(listing.id, "activate") }]
                              : []),
                            ...(!listing.isPremium && listing.status === "ACTIVE"
                              ? [{ label: "Zvýraznit (TOP)", onClick: () => handleAction(listing.id, "premium") }]
                              : []),
                            { label: "Smazat", onClick: () => setDeleteModal(listing.id), danger: true },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Smazat inzerát"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>Zrušit</Button>
            <Button
              variant="danger"
              onClick={() => deleteModal && handleAction(deleteModal, "delete")}
              disabled={actionLoading}
            >
              {actionLoading ? "Mažu..." : "Smazat"}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Opravdu chcete smazat tento inzerát? Tuto akci nelze vrátit zpět.
        </p>
      </Modal>
    </div>
  );
}
