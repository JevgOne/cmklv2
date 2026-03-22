"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PartCard } from "@/components/pwa-parts/parts/PartCard";
import { PartFilters } from "@/components/pwa-parts/parts/PartFilters";

interface PartResult {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  viewCount: number;
  stock: number;
}

export default function MyPartsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [parts, setParts] = useState<PartResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchParts() {
      try {
        // Získáme všechny díly a filtrujeme na klientu
        // API vrací jen ACTIVE díly, ale supplier potřebuje vidět i ostatní
        const res = await fetch("/api/parts?limit=100");
        if (res.ok) {
          const data = await res.json();
          setParts(data.parts ?? []);
        }
      } catch {
        // Zůstanou prázdné
      } finally {
        setLoading(false);
      }
    }
    fetchParts();
  }, []);

  const filtered = activeTab === "all"
    ? parts
    : parts.filter((p) => p.status === activeTab);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Moje díly</h1>
        <Link href="/parts/new" className="no-underline">
          <Button variant="primary" size="sm" className="bg-gradient-to-br from-green-500 to-green-600">
            + Přidat
          </Button>
        </Link>
      </div>

      <PartFilters activeTab={activeTab} onTabChange={setActiveTab} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((part) => (
            <PartCard
              key={part.id}
              id={part.id}
              name={part.name}
              category={part.category}
              price={part.price}
              status={part.status as "ACTIVE" | "SOLD" | "INACTIVE"}
              views={part.viewCount}
              quantity={part.stock}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-500 font-medium">Žádné díly v této kategorii</p>
        </div>
      )}

      {/* Import link */}
      <div className="text-center pt-4">
        <Link
          href="/parts/import"
          className="text-sm text-green-600 font-semibold no-underline"
        >
          Hromadný import z CSV
        </Link>
      </div>
    </div>
  );
}
