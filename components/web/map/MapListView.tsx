"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { StationCard } from "./StationCard";
import type { MapMarker } from "@/lib/map-config";

const MapView = dynamic(
  () => import("./MapView").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-400 text-sm">Načítám mapu...</div>
      </div>
    ),
  }
);

const REGIONS = [
  "Hlavní město Praha",
  "Středočeský",
  "Jihočeský",
  "Plzeňský",
  "Karlovarský",
  "Ústecký",
  "Liberecký",
  "Královéhradecký",
  "Pardubický",
  "Vysočina",
  "Jihomoravský",
  "Olomoucký",
  "Zlínský",
  "Moravskoslezský",
];

interface MapListViewProps {
  markers: MapMarker[];
  type: "stk" | "servis";
}

export function MapListView({
  markers,
}: MapListViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");


  const filtered = useMemo(() => {
    let result = markers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q)
      );
    }
    if (region) {
      result = result.filter((m) => {
        // Region matching — check if city contains region name or exact match
        return m.city.toLowerCase().includes(region.toLowerCase());
      });
    }
    return result;
  }, [markers, search, region]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Hledat stanici nebo město..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition cursor-pointer"
        >
          <option value="">Všechny kraje</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            activeTab === "list"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Seznam ({filtered.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            activeTab === "map"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Mapa
        </button>
      </div>

      {/* Split view desktop / tab content mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        {/* List */}
        <Card
          className={`overflow-hidden ${
            activeTab !== "list" ? "hidden lg:block" : ""
          }`}
        >
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Žádné stanice nenalezeny
              </div>
            ) : (
              filtered.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isSelected={station.id === selectedId}
                  onClick={() => setSelectedId(station.id)}
                />
              ))
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {filtered.length} z {markers.length} stanic
          </div>
        </Card>

        {/* Map */}
        <div
          className={`h-[400px] lg:h-[600px] rounded-xl overflow-hidden ${
            activeTab !== "map" ? "hidden lg:block" : ""
          }`}
        >
          <MapView
            markers={filtered}
            selectedId={selectedId}
            onMarkerClick={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
