"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ServisRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  tier: string;
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
  isClaimed: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  insurancePartner: boolean;
  pendingReviews: number;
  createdAt: string;
}

type Filter = "all" | "pending" | "verified" | "featured" | "unpublished";

interface Props {
  initialServisy: ServisRow[];
}

export function AdminServisyTable({ initialServisy }: Props) {
  const [servisy, setServisy] = useState(initialServisy);
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = servisy.filter((s) => {
    switch (filter) {
      case "pending": return s.pendingReviews > 0;
      case "verified": return s.isVerified;
      case "featured": return s.isFeatured;
      case "unpublished": return !s.isPublished;
      default: return true;
    }
  });

  async function toggleField(id: string, field: "isVerified" | "isPublished" | "isFeatured", value: boolean) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/autoservisy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (res.ok) {
        setServisy((prev) =>
          prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
      }
    } finally {
      setSaving(null);
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `Vše (${servisy.length})` },
    { key: "pending", label: `K moderaci (${servisy.filter((s) => s.pendingReviews > 0).length})` },
    { key: "verified", label: `Ověřené (${servisy.filter((s) => s.isVerified).length})` },
    { key: "featured", label: `Doporučené (${servisy.filter((s) => s.isFeatured).length})` },
    { key: "unpublished", label: `Skryté (${servisy.filter((s) => !s.isPublished).length})` },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Autoservisy</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filter === f.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Servis</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Město</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Typ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Hodnocení</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Recenze</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">K moderaci</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Ověřený</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Publikovaný</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Doporučený</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400">/{s.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.city}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      s.tier === "AUTORIZOVANY"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {s.tier === "AUTORIZOVANY" ? "Autoriz." : "Nezávislý"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-orange-400">★</span>{" "}
                    {s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{s.reviewCount}</td>
                  <td className="px-4 py-3 text-center">
                    {s.pendingReviews > 0 ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                        {s.pendingReviews}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant={s.isVerified ? "primary" : "secondary"}
                      disabled={saving === s.id}
                      onClick={() => toggleField(s.id, "isVerified", !s.isVerified)}
                    >
                      {s.isVerified ? "✓" : "—"}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant={s.isPublished ? "primary" : "secondary"}
                      disabled={saving === s.id}
                      onClick={() => toggleField(s.id, "isPublished", !s.isPublished)}
                    >
                      {s.isPublished ? "✓" : "—"}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant={s.isFeatured ? "primary" : "secondary"}
                      disabled={saving === s.id}
                      onClick={() => toggleField(s.id, "isFeatured", !s.isFeatured)}
                    >
                      {s.isFeatured ? "✓" : "—"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Žádné servisy v této kategorii
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
