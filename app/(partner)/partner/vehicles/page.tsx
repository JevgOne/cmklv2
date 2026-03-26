"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice, formatMileage } from "@/lib/utils";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  status: string;
  viewCount: number;
  images: Array<{ url: string }>;
  _count: { inquiries: number };
}

const statusTabs = [
  { value: "", label: "Vsechna" },
  { value: "ACTIVE", label: "Aktivni" },
  { value: "PENDING", label: "Cekajici" },
  { value: "SOLD", label: "Prodana" },
  { value: "DRAFT", label: "Drafty" },
];

const statusVariants: Record<string, "verified" | "pending" | "top" | "default"> = {
  ACTIVE: "verified",
  PENDING: "pending",
  SOLD: "top",
  DRAFT: "default",
  RESERVED: "pending",
};

export default function PartnerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));

      try {
        const res = await fetch(`/api/partner/vehicles?${params}`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Moje vozidla</h1>
        <Link href="/partner/vehicles/new">
          <Button variant="primary" size="sm">Pridat vozidlo</Button>
        </Link>
      </div>

      <Tabs
        tabs={statusTabs}
        activeTab={status}
        onTabChange={(val) => { setStatus(val); setPage(1); }}
        className="mb-6"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-64 animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon="🚗"
          title="Zadna vozidla"
          description="Zatim nemate zadna vozidla v systemu."
          actionLabel="Pridat vozidlo"
          onAction={() => (window.location.href = "/partner/vehicles/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {vehicles.map((v) => (
              <Card key={v.id} hover className="overflow-hidden">
                <div className="aspect-[16/10] bg-gray-100 relative">
                  {v.images[0] ? (
                    <img
                      src={v.images[0].url}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                      🚗
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={statusVariants[v.status] || "default"}>
                      {v.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {v.brand} {v.model} ({v.year})
                  </h3>
                  <div className="text-lg font-extrabold text-orange-500 mb-2">
                    {formatPrice(v.price)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatMileage(v.mileage)}</span>
                    <div className="flex gap-3">
                      <span>👁 {v.viewCount}</span>
                      <span>💬 {v._count.inquiries}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
