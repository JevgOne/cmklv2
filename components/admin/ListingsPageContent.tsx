"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/admin/DataTable";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";

interface ListingRow {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  listingType: string;
  status: string;
  isPremium: boolean;
  flagCount: number;
  viewCount: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    companyName: string | null;
    accountType: string | null;
  };
}

const tabs = [
  { value: "all", label: "Všechny" },
  { value: "flagged", label: "Flagované" },
  { value: "pending", label: "Ke schválení" },
];

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
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="verified">Aktivní</Badge>;
    case "DRAFT":
      return <Badge variant="default">Koncept</Badge>;
    case "INACTIVE":
      return <Badge variant="pending">Neaktivní</Badge>;
    case "SOLD":
      return <Badge variant="default">Prodáno</Badge>;
    case "EXPIRED":
      return <Badge variant="rejected">Expirováno</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

function getListingTypeBadge(type: string) {
  switch (type) {
    case "BROKER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded text-[11px] font-semibold text-orange-700">
          Makléř
        </span>
      );
    case "DEALER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-[11px] font-semibold text-blue-700">
          Bazar
        </span>
      );
    case "PRIVATE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[11px] font-semibold text-gray-600">
          Soukromý
        </span>
      );
    default:
      return null;
  }
}

export function ListingsPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (activeTab === "flagged") params.set("flagged", "true");
      if (activeTab === "pending") params.set("status", "DRAFT");

      const res = await fetch(`/api/admin/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleAction = async (id: string, action: "approve" | "reject" | "deactivate") => {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchListings();
      }
    } catch {
      // silently fail
    }
  };

  const columns = [
    {
      key: "name",
      header: "Vozidlo",
      render: (item: ListingRow) => (
        <div>
          <button
            onClick={() => router.push(`/admin/inzerce/${item.id}`)}
            className="font-semibold text-gray-900 hover:text-orange-600 transition-colors bg-transparent border-none cursor-pointer text-left p-0"
          >
            {item.brand} {item.model} {item.variant || ""}
          </button>
          <div className="text-xs text-gray-400 mt-0.5">
            {item.year} · {formatPrice(item.price)}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Typ",
      className: "hidden md:table-cell",
      render: (item: ListingRow) => (
        <div className="flex flex-col gap-1">
          {getListingTypeBadge(item.listingType)}
          {item.isPremium && <Badge variant="top">TOP</Badge>}
        </div>
      ),
    },
    {
      key: "seller",
      header: "Inzerent",
      render: (item: ListingRow) => (
        <div>
          <div className="text-sm text-gray-900">
            {item.user.companyName || `${item.user.firstName} ${item.user.lastName}`}
          </div>
          <div className="text-xs text-gray-400">
            {item.user.accountType || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Datum",
      render: (item: ListingRow) => (
        <span className="text-sm text-gray-600">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Stav",
      render: (item: ListingRow) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(item.status)}
          {item.flagCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded text-[11px] font-semibold text-red-700">
              {item.flagCount}x nahlášen
            </span>
          )}
        </div>
      ),
    },
    {
      key: "views",
      header: "Zobrazení",
      className: "hidden md:table-cell",
      render: (item: ListingRow) => (
        <span className="text-sm text-gray-600">{item.viewCount}</span>
      ),
    },
    {
      key: "actions",
      header: "Akce",
      render: (item: ListingRow) => (
        <div className="flex items-center gap-2">
          {item.status === "DRAFT" && (
            <>
              <button
                onClick={() => handleAction(item.id, "approve")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                Schválit
              </button>
              <button
                onClick={() => handleAction(item.id, "reject")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                Zamítnout
              </button>
            </>
          )}
          {item.status === "ACTIVE" && (
            <button
              onClick={() => handleAction(item.id, "deactivate")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M4.5 7a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Z" /></svg>
              Deaktivovat
            </button>
          )}
          {item.status === "INACTIVE" && (
            <button
              onClick={() => handleAction(item.id, "approve")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
              Aktivovat
            </button>
          )}
          <button
            onClick={() => router.push(`/admin/inzerce/${item.id}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.22 8.72a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 1 1 1.06 1.06L7.81 8l2.97 2.78a.75.75 0 1 1-1.06 1.06l-3.5-3.5Z" /></svg>
            Detail
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Inzerce</h1>
          <p className="text-sm text-gray-500 mt-1">
            Správa a moderace inzerátů na platformě
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(v) => {
            setActiveTab(v);
            setPage(1);
          }}
        />
      </div>

      {/* Search */}
      <div className="mb-4 max-w-md">
        <Input
          placeholder="Hledat dle značky, modelu, inzerenta..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Žádné inzeráty k zobrazení
          </div>
        ) : (
          <DataTable columns={columns} data={listings} />
        )}
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
