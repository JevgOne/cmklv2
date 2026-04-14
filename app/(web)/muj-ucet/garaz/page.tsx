"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

interface GarageCar {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  nickname: string | null;
  isDefault: boolean;
  createdAt: string;
}

export default function GaragePage() {
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [nickname, setNickname] = useState("");

  const fetchCars = useCallback(async () => {
    try {
      const res = await fetch("/api/garage");
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year: year ? parseInt(year, 10) : undefined,
          vin: vin || undefined,
          nickname: nickname || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se přidat auto");
      }
      // Reset form
      setBrand("");
      setModel("");
      setYear("");
      setVin("");
      setNickname("");
      setShowForm(false);
      await fetchCars();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/garage/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchCars();
      }
    } catch {
      // silently fail
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/garage/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        await fetchCars();
      }
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Moje garáž</h2>
          <p className="text-sm text-gray-500 mt-1">
            Uložte si svá auta pro rychlejší hledání dílů (max. 5)
          </p>
        </div>
        {cars.length < 5 && (
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Zrušit" : "+ Přidat auto"}
          </Button>
        )}
      </div>

      {/* Add car form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Nové auto</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Značka *"
                placeholder="Škoda"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
              <Input
                label="Model *"
                placeholder="Octavia"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
              <Input
                label="Rok výroby"
                placeholder="2018"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="VIN (nepovinné)"
                placeholder="TMBZZZ5JXJZ123456"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                maxLength={17}
              />
              <Input
                label="Přezdívka"
                placeholder="Můj Octávek"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ukládám..." : "Uložit auto"}
            </Button>
          </form>
        </Card>
      )}

      {/* Car list */}
      {cars.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">&#128663;</div>
          <h3 className="font-bold text-gray-900 mb-2">Garáž je prázdná</h3>
          <p className="text-gray-500 text-sm">
            Přidejte své auto a my vám usnadníme hledání kompatibilních dílů.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cars.map((car) => (
            <Card key={car.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">
                      {car.brand} {car.model}
                    </h3>
                    {car.isDefault && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        Výchozí
                      </span>
                    )}
                  </div>
                  {car.nickname && (
                    <p className="text-sm text-gray-500">&quot;{car.nickname}&quot;</p>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    {car.year && <span>Rok: {car.year}</span>}
                    {car.vin && <span className="ml-3">VIN: {car.vin}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!car.isDefault && (
                    <button
                      onClick={() => handleSetDefault(car.id)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer bg-transparent border-none"
                      title="Nastavit jako výchozí"
                    >
                      Výchozí
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer bg-transparent border-none"
                    title="Odebrat"
                  >
                    Smazat
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link
                  href={`/dily/katalog?brand=${encodeURIComponent(car.brand)}`}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium no-underline"
                >
                  Hledat díly pro {car.brand} {car.model} &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
