"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

interface Part {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  quantity: number;
  status: string;
  images: string;
  createdAt: string;
}

const statusVariants: Record<string, "verified" | "pending" | "top" | "default"> = {
  ACTIVE: "verified",
  RESERVED: "pending",
  SOLD: "top",
  INACTIVE: "default",
};

export default function PartnerPartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/partner/parts?page=${page}`);
        if (res.ok) {
          const data = await res.json();
          setParts(data.parts);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to load parts:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Moje dily</h1>
        <Link href="/partner/parts/new">
          <Button variant="primary" size="sm">
            Pridat dil
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-48 animate-pulse" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <EmptyState
          icon="🔧"
          title="Zadne dily"
          description="Zatim nemate zadne dily v systemu."
          actionLabel="Pridat dil"
          onAction={() => (window.location.href = "/partner/parts/new")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {parts.map((part) => (
              <Card key={part.id} hover className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                    {part.name}
                  </h3>
                  <Badge variant={statusVariants[part.status] || "default"}>
                    {part.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {part.brand} {part.model} | {part.condition}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-orange-500">
                    {formatPrice(part.price)}
                  </span>
                  <span className="text-xs text-gray-400">
                    Skladem: {part.quantity}
                  </span>
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
