"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";

interface Watchdog {
  id: string;
  brand: string | null;
  model: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  fuelType: string | null;
  bodyType: string | null;
  city: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
}

interface WatchdogForm {
  brand: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  fuelType: string;
  bodyType: string;
  city: string;
}

const initialForm: WatchdogForm = {
  brand: "",
  model: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  fuelType: "",
  bodyType: "",
  city: "",
};

const brands = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai",
  "Kia", "Mazda", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Renault",
  "Seat", "Škoda", "Toyota", "Volkswagen", "Volvo",
];

const fuelTypes = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "LPG", label: "LPG" },
];

const bodyTypes = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "VAN", label: "Van" },
];

const cities = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
  "České Budějovice", "Hradec Králové", "Pardubice", "Zlín",
];

const years = Array.from({ length: 27 }, (_, i) => ({
  value: String(2026 - i),
  label: String(2026 - i),
}));

function formatCriteria(wd: Watchdog): string {
  const parts: string[] = [];
  if (wd.brand) parts.push(wd.brand);
  if (wd.model) parts.push(wd.model);
  if (wd.minYear || wd.maxYear) {
    parts.push(`${wd.minYear || "?"}-${wd.maxYear || "?"}`);
  }
  if (wd.fuelType) parts.push(wd.fuelType);
  if (wd.minPrice || wd.maxPrice) {
    const min = wd.minPrice ? `${(wd.minPrice / 1000).toFixed(0)}k` : "0";
    const max = wd.maxPrice ? `${(wd.maxPrice / 1000).toFixed(0)}k` : "+";
    parts.push(`${min}-${max} Kč`);
  }
  if (wd.city) parts.push(wd.city);
  return parts.length > 0 ? parts.join(" \u00b7 ") : "Bez kritérií";
}

export default function HlidaciPesPage() {
  const [watchdogs, setWatchdogs] = useState<Watchdog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WatchdogForm>(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchWatchdogs();
  }, []);

  const fetchWatchdogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/watchdog");
      if (res.ok) {
        const data = await res.json();
        setWatchdogs(data.watchdogs || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const body: Record<string, string | number | undefined> = {};
      if (form.brand) body.brand = form.brand;
      if (form.model) body.model = form.model;
      if (form.minPrice) body.minPrice = Number(form.minPrice);
      if (form.maxPrice) body.maxPrice = Number(form.maxPrice);
      if (form.minYear) body.minYear = Number(form.minYear);
      if (form.maxYear) body.maxYear = Number(form.maxYear);
      if (form.fuelType) body.fuelType = form.fuelType;
      if (form.bodyType) body.bodyType = form.bodyType;
      if (form.city) body.city = form.city;

      const res = await fetch("/api/watchdog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setForm(initialForm);
        setShowForm(false);
        fetchWatchdogs();
      }
    } catch {
      // silently fail
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (wdId: string, active: boolean) => {
    try {
      await fetch(`/api/watchdog/${wdId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      setWatchdogs((prev) =>
        prev.map((w) => (w.id === wdId ? { ...w, active } : w))
      );
    } catch {
      // silently fail
    }
  };

  const deleteWatchdog = async (wdId: string) => {
    try {
      await fetch(`/api/watchdog/${wdId}`, { method: "DELETE" });
      setWatchdogs((prev) => prev.filter((w) => w.id !== wdId));
    } catch {
      // silently fail
    }
  };

  const updateForm = (key: keyof WatchdogForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Hlídací psi ({watchdogs.length})
        </h2>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Nový hlídací pes
        </Button>
      </div>

      {watchdogs.length === 0 && !showForm ? (
        <EmptyState
          icon="&#128276;"
          title="Nemáte žádné hlídací psy"
          description="Nastavte si hlídacího psa a budeme vás informovat o nových vozidlech."
          actionLabel="Vytvořit hlídacího psa"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {watchdogs.map((wd) => (
            <Card key={wd.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {wd.brand || "Všechny značky"} {wd.model || ""}
                    </span>
                    <Badge variant={wd.active ? "verified" : "default"}>
                      {wd.active ? "Aktivní" : "Pozastaven"}
                    </Badge>
                    {wd.email && (
                      <Badge variant="default">
                        Email: {wd.email}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {formatCriteria(wd)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Toggle
                    checked={wd.active}
                    onChange={(checked) => toggleActive(wd.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWatchdog(wd.id)}
                    className="text-error-500"
                  >
                    Smazat
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create watchdog modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setForm(initialForm);
        }}
        title="Nový hlídací pes"
        className="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Zrušit</Button>
            <Button variant="primary" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? "Ukládám..." : "Vytvořit"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Značka"
              placeholder="Libovolná"
              options={brands.map((b) => ({ value: b, label: b }))}
              value={form.brand}
              onChange={(e) => updateForm("brand", e.target.value)}
            />
            <Input
              label="Model"
              placeholder="Libovolný"
              value={form.model}
              onChange={(e) => updateForm("model", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cena od (Kč)"
              type="number"
              placeholder="0"
              value={form.minPrice}
              onChange={(e) => updateForm("minPrice", e.target.value)}
            />
            <Input
              label="Cena do (Kč)"
              type="number"
              placeholder="Bez limitu"
              value={form.maxPrice}
              onChange={(e) => updateForm("maxPrice", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Rok od"
              placeholder="Libovolný"
              options={years}
              value={form.minYear}
              onChange={(e) => updateForm("minYear", e.target.value)}
            />
            <Select
              label="Rok do"
              placeholder="Libovolný"
              options={years}
              value={form.maxYear}
              onChange={(e) => updateForm("maxYear", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Palivo"
              placeholder="Libovolné"
              options={fuelTypes}
              value={form.fuelType}
              onChange={(e) => updateForm("fuelType", e.target.value)}
            />
            <Select
              label="Karoserie"
              placeholder="Libovolná"
              options={bodyTypes}
              value={form.bodyType}
              onChange={(e) => updateForm("bodyType", e.target.value)}
            />
          </div>

          <Select
            label="Město"
            placeholder="Libovolné"
            options={cities.map((c) => ({ value: c, label: c }))}
            value={form.city}
            onChange={(e) => updateForm("city", e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
