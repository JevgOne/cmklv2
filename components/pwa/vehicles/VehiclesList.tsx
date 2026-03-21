"use client";

import { useState } from "react";
import { VehicleFilters } from "./VehicleFilters";
import { VehicleCard } from "./VehicleCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface VehicleData {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  price: number;
  status: string;
  fuelType: string;
  transmission: string;
  viewCount: number;
  images: { url: string; isPrimary: boolean }[];
}

interface VehiclesListProps {
  vehicles: VehicleData[];
}

export function VehiclesList({ vehicles }: VehiclesListProps) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? vehicles
      : vehicles.filter((v) => v.status === filter);

  return (
    <div className="space-y-4">
      <VehicleFilters activeFilter={filter} onFilterChange={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="🚗"
          title="Zadne vozidla"
          description={
            filter === "all"
              ? "Zatim jste nepridali zadne vozidlo."
              : "V teto kategorii nemáte zadne vozidlo."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
