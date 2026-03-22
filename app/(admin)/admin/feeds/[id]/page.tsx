"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

interface FeedSupplier {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

interface ImportLog {
  id: string;
  status: string;
  totalItems: number;
  created: number;
  updated: number;
  deactivated: number;
  errors: number;
  errorDetails: string | null;
  duration: number;
  createdAt: string;
}

interface FeedDetail {
  id: string;
  name: string;
  feedUrl: string;
  feedFormat: string;
  fieldMapping: string | null;
  updateFrequency: string;
  markupType: string;
  markupValue: number;
  categoryMarkups: string | null;
  defaultPartType: string;
  isActive: boolean;
  lastImportAt: string | null;
  lastImportCount: number | null;
  lastImportErrors: number | null;
  supplier: FeedSupplier;
  _count: { parts: number; importLogs: number };
  importLogs: ImportLog[];
  createdAt: string;
}

function formatDate(date: string | null): string {
  if (!date) return "Nikdy";
  return new Date(date).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

const statusColors: Record<string, "success" | "warning" | "destructive" | "default"> = {
  SUCCESS: "success",
  PARTIAL: "warning",
  FAILED: "destructive",
};

const frequencyOptions = [
  { value: "DAILY", label: "Denně" },
  { value: "WEEKLY", label: "Týdně" },
  { value: "MANUAL", label: "Ručně" },
];

const formatOptions = [
  { value: "XML", label: "XML" },
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
];

const markupTypeOptions = [
  { value: "PERCENT", label: "Procenta (%)" },
  { value: "FIXED", label: "Fixní (Kč)" },
];

const partTypeOptions = [
  { value: "NEW", label: "Nové" },
  { value: "AFTERMARKET", label: "Aftermarket" },
];

export default function FeedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedId = params.id as string;

  const [feed, setFeed] = useState<FeedDetail | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editFormat, setEditFormat] = useState("XML");
  const [editFrequency, setEditFrequency] = useState("DAILY");
  const [editMarkupType, setEditMarkupType] = useState("PERCENT");
  const [editMarkupValue, setEditMarkupValue] = useState("25");
  const [editPartType, setEditPartType] = useState("AFTERMARKET");
  const [editActive, setEditActive] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}`);
      const data = await res.json();
      if (data.feed) {
        setFeed(data.feed);
        setLogs(data.feed.importLogs ?? []);
      }
    } catch {
      // handled in UI
    } finally {
      setLoading(false);
    }
  }, [feedId]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}/logs?limit=50`);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      // handled in UI
    }
  }, [feedId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const startEdit = () => {
    if (!feed) return;
    setEditName(feed.name);
    setEditUrl(feed.feedUrl);
    setEditFormat(feed.feedFormat);
    setEditFrequency(feed.updateFrequency);
    setEditMarkupType(feed.markupType);
    setEditMarkupValue(String(feed.markupValue));
    setEditPartType(feed.defaultPartType);
    setEditActive(feed.isActive);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          feedUrl: editUrl,
          feedFormat: editFormat,
          updateFrequency: editFrequency,
          markupType: editMarkupType,
          markupValue: parseFloat(editMarkupValue) || 25,
          defaultPartType: editPartType,
          isActive: editActive,
        }),
      });
      if (res.ok) {
        setEditing(false);
        fetchFeed();
      } else {
        const data = await res.json();
        alert(`Chyba: ${data.error}`);
      }
    } catch {
      alert("Uložení selhalo");
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}/import`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Import dokončen: ${data.result.created} nových, ${data.result.updated} aktualizovaných, ${data.result.errors} chyb`
        );
        fetchFeed();
        fetchLogs();
      } else {
        alert(`Chyba: ${data.error}`);
      }
    } catch {
      alert("Import selhal");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Opravdu chcete smazat tuto feed konfiguraci? Importované díly zůstanou.")) return;
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/feeds");
      } else {
        alert("Smazání selhalo");
      }
    } catch {
      alert("Smazání selhalo");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="bg-white rounded-2xl h-48 shadow-sm" />
        <div className="bg-white rounded-2xl h-64 shadow-sm" />
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-4">404</span>
        <h2 className="text-xl font-bold text-gray-900">Feed nenalezen</h2>
        <Link href="/admin/feeds" className="text-orange-500 mt-4 inline-block no-underline">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const supplierName =
    feed.supplier.companyName ?? `${feed.supplier.firstName} ${feed.supplier.lastName}`;

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
        <span className="text-gray-900 font-medium">{feed.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{feed.name}</h1>
            <Badge variant={feed.isActive ? "success" : "default"}>
              {feed.isActive ? "Aktivní" : "Neaktivní"}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            Dodavatel: {supplierName} | Formát: {feed.feedFormat} |{" "}
            {feed._count.parts} dílů
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? "Importuji..." : "Importovat nyní"}
          </Button>
          <Button variant="ghost" onClick={startEdit}>
            Upravit
          </Button>
          <Button variant="ghost" onClick={handleDelete}>
            Smazat
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upravit konfiguraci</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Název" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input label="URL feedu" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
            <Select
              label="Formát"
              options={formatOptions}
              value={editFormat}
              onChange={(e) => setEditFormat(e.target.value)}
            />
            <Select
              label="Frekvence aktualizace"
              options={frequencyOptions}
              value={editFrequency}
              onChange={(e) => setEditFrequency(e.target.value)}
            />
            <Select
              label="Typ přirážky"
              options={markupTypeOptions}
              value={editMarkupType}
              onChange={(e) => setEditMarkupType(e.target.value)}
            />
            <Input
              label={editMarkupType === "PERCENT" ? "Přirážka (%)" : "Přirážka (Kč)"}
              type="number"
              value={editMarkupValue}
              onChange={(e) => setEditMarkupValue(e.target.value)}
            />
            <Select
              label="Typ dílů"
              options={partTypeOptions}
              value={editPartType}
              onChange={(e) => setEditPartType(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                Stav
              </span>
              <label className="flex items-center gap-2 cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-[15px] font-medium text-gray-700">Aktivní</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Zrušit
            </Button>
          </div>
        </Card>
      )}

      {/* Config details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Konfigurace
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">URL feedu</span>
              <span className="text-gray-900 font-medium truncate max-w-[300px]">{feed.feedUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Formát</span>
              <span className="text-gray-900 font-medium">{feed.feedFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Frekvence</span>
              <span className="text-gray-900 font-medium">
                {frequencyOptions.find((o) => o.value === feed.updateFrequency)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Typ dílů</span>
              <span className="text-gray-900 font-medium">
                {feed.defaultPartType === "NEW" ? "Nové" : "Aftermarket"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Přirážka
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Typ</span>
              <span className="text-gray-900 font-medium">
                {feed.markupType === "PERCENT" ? "Procentuální" : "Fixní"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hodnota</span>
              <span className="text-gray-900 font-medium">
                {feed.markupType === "PERCENT"
                  ? `${feed.markupValue}%`
                  : `${feed.markupValue} Kč`}
              </span>
            </div>
            {feed.categoryMarkups && (
              <div>
                <span className="text-gray-500 block mb-1">Per-kategorie přirážky:</span>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  {Object.entries(JSON.parse(feed.categoryMarkups) as Record<string, number>).map(
                    ([cat, val]) => (
                      <div key={cat}>
                        {cat}: {val}%
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Field mapping */}
      {feed.fieldMapping && (
        <Card className="p-6 mb-8">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
            Mapování polí
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            {Object.entries(JSON.parse(feed.fieldMapping) as Record<string, string>).map(
              ([key, val]) => (
                <div key={key} className="flex gap-4 py-1">
                  <span className="text-gray-500 w-32">{key}</span>
                  <span className="text-gray-900">{val}</span>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      {/* Import logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Historie importů
          </h3>
          <Button variant="ghost" size="sm" onClick={fetchLogs}>
            Obnovit
          </Button>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            Zatím nebyl proveden žádný import.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Datum</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Celkem</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Nových</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Aktualizovaných</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Deaktivovaných</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Chyb</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-600">Trvání</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-700">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-2">
                      <Badge variant={statusColors[log.status] ?? "default"}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">{log.totalItems}</td>
                    <td className="py-3 px-2 text-right text-green-600">{log.created}</td>
                    <td className="py-3 px-2 text-right text-blue-600">{log.updated}</td>
                    <td className="py-3 px-2 text-right text-gray-500">{log.deactivated}</td>
                    <td className="py-3 px-2 text-right text-red-500">{log.errors}</td>
                    <td className="py-3 px-2 text-right text-gray-500">
                      {formatDuration(log.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
