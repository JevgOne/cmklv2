"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContractFilters } from "./ContractFilters";
import { ContractCard } from "./ContractCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

interface ContractData {
  id: string;
  type: string;
  sellerName: string;
  sellerPhone: string;
  price: number | null;
  commission: number | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
  } | null;
}

interface ContractsListProps {
  contracts: ContractData[];
}

export function ContractsList({ contracts }: ContractsListProps) {
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const filtered = filter === "all"
    ? contracts
    : contracts.filter((c) => c.status === filter);

  const counts = useMemo(() => {
    const result: Record<string, number> = { total: contracts.length };
    for (const c of contracts) {
      result[c.status] = (result[c.status] || 0) + 1;
    }
    return result;
  }, [contracts]);

  return (
    <div className="space-y-4">
      <ContractFilters activeFilter={filter} onFilterChange={setFilter} counts={counts} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Zadne smlouvy"
          description={
            filter === "all"
              ? "Zatim jste nevytvorili zadnou smlouvu."
              : "V teto kategorii nemate zadnou smlouvu."
          }
          actionLabel={filter === "all" ? "+ Nova smlouva" : undefined}
          onAction={filter === "all" ? () => router.push("/makler/contracts/new") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}

      {/* FAB - New contract button */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg shadow-orange-500/30"
          onClick={() => router.push("/makler/contracts/new")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Nova smlouva
        </Button>
      </div>
    </div>
  );
}
