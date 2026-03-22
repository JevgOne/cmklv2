"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function WatchdogEmailForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Zadejte platný email.");
      return;
    }

    setLoading(true);
    setError("");

    // Sestavit kritéria z aktuálních filtrů
    const criteria: Record<string, string | number> = { email: email.trim() };
    const brand = searchParams.get("brand");
    const fuelType = searchParams.get("fuelType");
    const bodyType = searchParams.get("bodyType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minYear = searchParams.get("minYear");
    const maxYear = searchParams.get("maxYear");
    const city = searchParams.get("city");

    if (brand) criteria.brand = brand;
    if (fuelType) criteria.fuelType = fuelType;
    if (bodyType) criteria.bodyType = bodyType;
    if (minPrice) criteria.minPrice = Number(minPrice);
    if (maxPrice) criteria.maxPrice = Number(maxPrice);
    if (minYear) criteria.minYear = Number(minYear);
    if (maxYear) criteria.maxYear = Number(maxYear);
    if (city) criteria.city = city;

    try {
      const res = await fetch("/api/watchdog/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se nastavit hlídání.");
      }
    } catch {
      setError("Chyba připojení.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-5 bg-green-50 border border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Hlídání nastaveno</p>
            <p className="text-xs text-green-600 mt-0.5">
              Na <strong>{email}</strong> vás budeme informovat o nových vozidlech.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">
              Hlídejte bez registrace
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Zadejte email a budeme vás informovat o nových nabídkách.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-1 w-full sm:w-auto">
          <Input
            type="email"
            placeholder="vas@email.cz"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className="flex-1"
          />
          <Button type="submit" variant="primary" size="default" disabled={loading} className="shrink-0">
            {loading ? "..." : "Hlídat"}
          </Button>
        </form>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </Card>
  );
}
