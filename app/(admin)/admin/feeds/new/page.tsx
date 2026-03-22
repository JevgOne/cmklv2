"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Supplier {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

const frequencyOptions = [
  { value: "DAILY", label: "Denne" },
  { value: "WEEKLY", label: "Tydne" },
  { value: "MANUAL", label: "Rucne" },
];

const formatOptions = [
  { value: "XML", label: "XML" },
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
];

const markupTypeOptions = [
  { value: "PERCENT", label: "Procenta (%)" },
  { value: "FIXED", label: "Fixni (Kc)" },
];

const partTypeOptions = [
  { value: "NEW", label: "Nove" },
  { value: "AFTERMARKET", label: "Aftermarket" },
];

export default function NewFeedPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [feedFormat, setFeedFormat] = useState("XML");
  const [updateFrequency, setUpdateFrequency] = useState("DAILY");
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("25");
  const [defaultPartType, setDefaultPartType] = useState("AFTERMARKET");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch("/api/admin/feeds/suppliers");
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data.suppliers ?? []);
        }
      } catch {
        // Suppliers may not be available
      } finally {
        setLoadingSuppliers(false);
      }
    }
    loadSuppliers();
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Nazev je povinny");
      return;
    }
    if (!feedUrl.trim()) {
      setError("URL feedu je povinna");
      return;
    }
    if (!supplierId) {
      setError("Vyberte dodavatele");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          name: name.trim(),
          feedUrl: feedUrl.trim(),
          feedFormat,
          updateFrequency,
          markupType,
          markupValue: parseFloat(markupValue) || 25,
          defaultPartType,
          isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/feeds/${data.feed.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Vytvoreni selhalo");
      }
    } catch {
      setError("Vytvoreni selhalo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          href="/admin/feeds"
          className="hover:text-orange-500 transition-colors no-underline text-gray-500"
        >
          Feed importy
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Novy feed</span>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-8">Novy feed</h1>

      <Card className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nazev"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Napr. AutoParts XML feed"
          />

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Dodavatel
            </label>
            {loadingSuppliers ? (
              <div className="py-3.5 px-[18px] bg-gray-50 rounded-lg text-sm text-gray-400">
                Nacitam dodavatele...
              </div>
            ) : suppliers.length === 0 ? (
              <div className="py-3.5 px-[18px] bg-gray-50 rounded-lg text-sm text-gray-400">
                Zadni dodavatele v systemu. Nejprve vytvorte uzivatele s roli dodavatele.
              </div>
            ) : (
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 cursor-pointer appearance-none hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Vyberte dodavatele</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName ?? `${s.firstName} ${s.lastName}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="URL feedu"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://dodavatel.cz/feed.xml"
          />

          <Select
            label="Format"
            options={formatOptions}
            value={feedFormat}
            onChange={(e) => setFeedFormat(e.target.value)}
          />

          <Select
            label="Frekvence aktualizace"
            options={frequencyOptions}
            value={updateFrequency}
            onChange={(e) => setUpdateFrequency(e.target.value)}
          />

          <Select
            label="Typ prirazky"
            options={markupTypeOptions}
            value={markupType}
            onChange={(e) => setMarkupType(e.target.value)}
          />

          <Input
            label={markupType === "PERCENT" ? "Prirazka (%)" : "Prirazka (Kc)"}
            type="number"
            value={markupValue}
            onChange={(e) => setMarkupValue(e.target.value)}
          />

          <Select
            label="Typ dilu"
            options={partTypeOptions}
            value={defaultPartType}
            onChange={(e) => setDefaultPartType(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              Stav
            </span>
            <label className="flex items-center gap-2 cursor-pointer py-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-[15px] font-medium text-gray-700">Aktivni</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Vytvarim..." : "Vytvorit feed"}
          </Button>
          <Link href="/admin/feeds" className="no-underline">
            <Button variant="ghost">Zrusit</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
