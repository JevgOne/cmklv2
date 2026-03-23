"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

const brandOptions = [
  { value: "Škoda", label: "Škoda" },
  { value: "Volkswagen", label: "Volkswagen" },
  { value: "BMW", label: "BMW" },
  { value: "Audi", label: "Audi" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Toyota", label: "Toyota" },
  { value: "Ford", label: "Ford" },
  { value: "Kia", label: "Kia" },
  { value: "Peugeot", label: "Peugeot" },
  { value: "Renault", label: "Renault" },
  { value: "Opel", label: "Opel" },
  { value: "Citroën", label: "Citroën" },
  { value: "Honda", label: "Honda" },
  { value: "Mazda", label: "Mazda" },
  { value: "Volvo", label: "Volvo" },
];

const fuelOptions = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const transmissionOptions = [
  { value: "AUTOMATIC", label: "Automat" },
  { value: "MANUAL", label: "Manuál" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const sortOptions = [
  { value: "newest", label: "Nejnovější" },
  { value: "cheapest", label: "Nejlevnější" },
  { value: "expensive", label: "Nejdražší" },
  { value: "lowestkm", label: "Nejmenší km" },
];

const bodyTypeOptions = [
  { value: "SEDAN", label: "Sedan" },
  { value: "COMBI", label: "Kombi" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "MPV/Van" },
  { value: "PICKUP", label: "Pickup" },
];

const sellerTypeOptions = [
  { value: "broker", label: "Makléř (ověřeno)" },
  { value: "dealer", label: "Autobazar" },
  { value: "private", label: "Soukromý prodejce" },
];

const yearOptions = Array.from({ length: 27 }, (_, i) => ({
  value: String(2000 + i),
  label: String(2000 + i),
}));

/* ------------------------------------------------------------------ */
/*  Filter content (reused in desktop inline + mobile modal)           */
/* ------------------------------------------------------------------ */

interface FilterContentProps {
  brand: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  sellerType: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  onBrandChange: (v: string) => void;
  onFuelTypeChange: (v: string) => void;
  onTransmissionChange: (v: string) => void;
  onBodyTypeChange: (v: string) => void;
  onSellerTypeChange: (v: string) => void;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  onMinYearChange: (v: string) => void;
  onMaxYearChange: (v: string) => void;
}

function FilterContent({
  brand,
  fuelType,
  transmission,
  bodyType,
  sellerType,
  minPrice,
  maxPrice,
  minYear,
  maxYear,
  onBrandChange,
  onFuelTypeChange,
  onTransmissionChange,
  onBodyTypeChange,
  onSellerTypeChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinYearChange,
  onMaxYearChange,
}: FilterContentProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Brand */}
      <Select
        label="Značka"
        placeholder="Všechny značky"
        options={brandOptions}
        value={brand}
        onChange={(e) => onBrandChange(e.target.value)}
      />

      {/* Price range */}
      <div>
        <span className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Cena
        </span>
        <div className="flex gap-3">
          <Input
            placeholder="Od"
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
          />
          <Input
            placeholder="Do"
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
          />
        </div>
      </div>

      {/* Year range */}
      <div>
        <span className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Rok výroby
        </span>
        <div className="flex gap-3">
          <Select
            placeholder="Od"
            options={yearOptions}
            value={minYear}
            onChange={(e) => onMinYearChange(e.target.value)}
          />
          <Select
            placeholder="Do"
            options={yearOptions}
            value={maxYear}
            onChange={(e) => onMaxYearChange(e.target.value)}
          />
        </div>
      </div>

      {/* Fuel type */}
      <Select
        label="Palivo"
        placeholder="Všechna paliva"
        options={fuelOptions}
        value={fuelType}
        onChange={(e) => onFuelTypeChange(e.target.value)}
      />

      {/* Transmission */}
      <Select
        label="Převodovka"
        placeholder="Všechny"
        options={transmissionOptions}
        value={transmission}
        onChange={(e) => onTransmissionChange(e.target.value)}
      />

      {/* Body type */}
      <Select
        label="Typ karoserie"
        placeholder="Všechny"
        options={bodyTypeOptions}
        value={bodyType}
        onChange={(e) => onBodyTypeChange(e.target.value)}
      />

      {/* Seller type */}
      <Select
        label="Prodejce"
        placeholder="Vše"
        options={sellerTypeOptions}
        value={sellerType}
        onChange={(e) => onSellerTypeChange(e.target.value)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface VehicleFiltersProps {
  resultCount?: number;
}

export function VehicleFilters({ resultCount = 0 }: VehicleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize state from URL search params
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [fuelType, setFuelType] = useState(searchParams.get("fuelType") || "");
  const [transmission, setTransmission] = useState(searchParams.get("transmission") || "");
  const [bodyType, setBodyType] = useState(searchParams.get("bodyType") || "");
  const [sellerType, setSellerType] = useState(searchParams.get("sellerType") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minYear, setMinYear] = useState(searchParams.get("minYear") || "");
  const [maxYear, setMaxYear] = useState(searchParams.get("maxYear") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // Počet aktivních filtrů
  const activeFilters = [brand, fuelType, transmission, bodyType, sellerType, minPrice, maxPrice, minYear, maxYear].filter(Boolean).length;

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (bodyType) params.set("bodyType", bodyType);
    if (sellerType) params.set("sellerType", sellerType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minYear) params.set("minYear", minYear);
    if (maxYear) params.set("maxYear", maxYear);
    if (sort && sort !== "newest") params.set("sort", sort);
    return params;
  }, [brand, fuelType, transmission, bodyType, sellerType, minPrice, maxPrice, minYear, maxYear, sort]);

  const applyFilters = useCallback(() => {
    const params = buildSearchParams();
    router.push(`/nabidka?${params.toString()}`);
  }, [buildSearchParams, router]);

  const resetFilters = useCallback(() => {
    setBrand("");
    setFuelType("");
    setTransmission("");
    setBodyType("");
    setSellerType("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setSort("newest");
    router.push("/nabidka");
  }, [router]);

  const handleSortChange = useCallback(
    (newSort: string) => {
      setSort(newSort);
      const params = buildSearchParams();
      if (newSort && newSort !== "newest") {
        params.set("sort", newSort);
      } else {
        params.delete("sort");
      }
      router.push(`/nabidka?${params.toString()}`);
    },
    [buildSearchParams, router]
  );

  const filterContentProps: FilterContentProps = {
    brand,
    fuelType,
    transmission,
    bodyType,
    sellerType,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    onBrandChange: setBrand,
    onFuelTypeChange: setFuelType,
    onTransmissionChange: setTransmission,
    onBodyTypeChange: setBodyType,
    onSellerTypeChange: setSellerType,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
    onMinYearChange: setMinYear,
    onMaxYearChange: setMaxYear,
  };

  return (
    <>
      {/* ============================================================ */}
      {/* Desktop: inline filter bar                                    */}
      {/* ============================================================ */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          <Select
            placeholder="Všechny značky"
            options={brandOptions}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <div className="flex gap-3">
            <Input
              placeholder="Cena od"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              placeholder="Cena do"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <Select
            placeholder="Palivo"
            options={fuelOptions}
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          />
          <Select
            placeholder="Převodovka"
            options={transmissionOptions}
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Select
            placeholder="Typ karoserie"
            options={bodyTypeOptions}
            className="max-w-[200px]"
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
          />
          <Select
            placeholder="Rok od"
            options={yearOptions}
            className="max-w-[140px]"
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
          />
          <Select
            placeholder="Rok do"
            options={yearOptions}
            className="max-w-[140px]"
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
          />
          <Select
            placeholder="Prodejce"
            options={sellerTypeOptions}
            className="max-w-[200px]"
            value={sellerType}
            onChange={(e) => setSellerType(e.target.value)}
          />
          <div className="flex gap-3 ml-auto">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Resetovat filtry
            </Button>
            <Button variant="primary" size="default" onClick={applyFilters}>
              Hledat
            </Button>
          </div>
        </div>

        {/* Result count + sort */}
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Nalezeno{" "}
            <span className="font-bold text-gray-900">{resultCount}</span>{" "}
            vozidel
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Řazení:</span>
            <Select
              options={sortOptions}
              className="!py-2 !text-sm max-w-[180px]"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Mobile: filter button + sort                                  */}
      {/* ============================================================ */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            className="flex-1"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            Filtry{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </Button>
          <Select
            options={sortOptions}
            className="!py-3 flex-1"
            placeholder="Řazení"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Nalezeno{" "}
          <span className="font-bold text-gray-900">{resultCount}</span>{" "}
          vozidel
        </p>
      </div>

      {/* ============================================================ */}
      {/* Mobile: fullscreen filter modal                               */}
      {/* ============================================================ */}
      <Modal
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Filtry"
        className="!max-w-full !max-h-full !rounded-none sm:!max-w-[500px] sm:!max-h-[90vh] sm:!rounded-2xl"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              size="default"
              className="flex-1"
              onClick={() => {
                resetFilters();
                setMobileOpen(false);
              }}
            >
              Resetovat
            </Button>
            <Button
              variant="primary"
              size="default"
              className="flex-1"
              onClick={() => {
                applyFilters();
                setMobileOpen(false);
              }}
            >
              Zobrazit výsledky
            </Button>
          </div>
        }
      >
        <FilterContent {...filterContentProps} />
      </Modal>
    </>
  );
}
