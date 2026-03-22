"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface FeedSupplier {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

interface FeedConfig {
  id: string;
  name: string;
  feedUrl: string;
  feedFormat: string;
  updateFrequency: string;
  markupType: string;
  markupValue: number;
  defaultPartType: string;
  isActive: boolean;
  lastImportAt: string | null;
  lastImportCount: number | null;
  lastImportErrors: number | null;
  supplier: FeedSupplier;
  _count: { parts: number; importLogs: number };
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

const frequencyLabels: Record<string, string> = {
  DAILY: "Denně",
  WEEKLY: "Týdně",
  MANUAL: "Ručně",
};

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<FeedConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchFeeds = async () => {
    try {
      const res = await fetch("/api/admin/feeds");
      const data = await res.json();
      setFeeds(data.feeds ?? []);
    } catch {
      // Chyba se zpracuje v UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleImport = async (feedId: string) => {
    setImporting(feedId);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}/import`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Import dokončen: ${data.result.created} nových, ${data.result.updated} aktualizovaných, ${data.result.errors} chyb`
        );
        fetchFeeds();
      } else {
        alert(`Chyba: ${data.error}`);
      }
    } catch {
      alert("Import selhal");
    } finally {
      setImporting(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-32 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500 font-medium">Eshop</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Feed importy</h1>
        </div>
        <Link href="/admin/feeds/new" className="no-underline">
          <Button variant="primary">+ Nový feed</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-sm text-gray-500">Aktivní feedy</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {feeds.filter((f) => f.isActive).length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Celkem dílů z feedů</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {feeds.reduce((sum, f) => sum + f._count.parts, 0)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Celkem importů</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {feeds.reduce((sum, f) => sum + f._count.importLogs, 0)}
          </p>
        </Card>
      </div>

      {/* Feed list */}
      {feeds.length === 0 ? (
        <Card className="p-12 text-center">
          <span className="text-5xl block mb-4">📡</span>
          <h3 className="text-xl font-bold text-gray-900">Žádné feedy</h3>
          <p className="text-gray-500 mt-2">
            Přidejte první feed od velkoobchodního dodavatele.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <Card key={feed.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/admin/feeds/${feed.id}`}
                      className="text-lg font-bold text-gray-900 hover:text-orange-500 transition-colors no-underline"
                    >
                      {feed.name}
                    </Link>
                    <Badge variant={feed.isActive ? "success" : "default"}>
                      {feed.isActive ? "Aktivní" : "Neaktivní"}
                    </Badge>
                    <Badge variant="default">{feed.feedFormat}</Badge>
                    <Badge variant="default">
                      {feed.defaultPartType === "NEW" ? "Nové" : "Aftermarket"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span>
                      Dodavatel:{" "}
                      <span className="font-medium text-gray-700">
                        {feed.supplier.companyName ??
                          `${feed.supplier.firstName} ${feed.supplier.lastName}`}
                      </span>
                    </span>
                    <span>
                      Frekvence:{" "}
                      <span className="font-medium text-gray-700">
                        {frequencyLabels[feed.updateFrequency] ?? feed.updateFrequency}
                      </span>
                    </span>
                    <span>
                      Markup:{" "}
                      <span className="font-medium text-gray-700">
                        {feed.markupType === "PERCENT"
                          ? `${feed.markupValue}%`
                          : `${feed.markupValue} Kč`}
                      </span>
                    </span>
                    <span>
                      Dílů: <span className="font-medium text-gray-700">{feed._count.parts}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400 mt-2">
                    <span>Poslední import: {formatDate(feed.lastImportAt)}</span>
                    {feed.lastImportCount !== null && (
                      <span>
                        Výsledek: {feed.lastImportCount} dílů
                        {(feed.lastImportErrors ?? 0) > 0 && (
                          <span className="text-red-500 ml-1">
                            ({feed.lastImportErrors} chyb)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImport(feed.id)}
                    disabled={importing === feed.id}
                  >
                    {importing === feed.id ? "Importuji..." : "Importovat"}
                  </Button>
                  <Link href={`/admin/feeds/${feed.id}`} className="no-underline">
                    <Button variant="ghost" size="sm">
                      Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
