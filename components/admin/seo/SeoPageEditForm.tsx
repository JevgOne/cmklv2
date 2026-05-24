"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeoStatusBadge } from "./SeoStatusBadge";
import { cn } from "@/lib/utils";

interface SeoPageData {
  id: string;
  pagePath: string;
  pageType: string;
  section: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  noIndex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  schemaTypesJson: string | null;
  auditStatus: string | null;
  auditNotes: string | null;
  lastAuditedAt: string | null;
  updatedAt: string;
}

interface SeoPageEditFormProps {
  page: SeoPageData;
}

function getCharColor(len: number, max: number) {
  if (len <= max) return "text-green-600";
  if (len <= max + 10) return "text-amber-600";
  return "text-red-600";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SeoPageEditForm({ page }: SeoPageEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);

  const [title, setTitle] = useState(page.title || "");
  const [description, setDescription] = useState(page.description || "");
  const [canonical, setCanonical] = useState(page.canonical || "");
  const [noIndex, setNoIndex] = useState(page.noIndex);
  const [ogTitle, setOgTitle] = useState(page.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(page.ogDescription || "");
  const [ogImageUrl, setOgImageUrl] = useState(page.ogImageUrl || "");
  const [auditStatus, setAuditStatus] = useState(page.auditStatus);
  const [auditNotes, setAuditNotes] = useState(page.auditNotes);
  const [lastAuditedAt, setLastAuditedAt] = useState(page.lastAuditedAt);

  const schemaTypes: string[] = (() => {
    try {
      return page.schemaTypesJson ? JSON.parse(page.schemaTypesJson) : [];
    } catch {
      return [];
    }
  })();

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seo/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          canonical: canonical || null,
          noIndex,
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          ogImageUrl: ogImageUrl || null,
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [page.id, title, description, canonical, noIndex, ogTitle, ogDescription, ogImageUrl, router]);

  // STOP-2: delete override = revert to code defaults
  const handleDelete = async () => {
    if (!confirm("Smazat override? Metadata se vrátí na výchozí hodnoty z kódu.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/seo/pages/${page.id}`, { method: "DELETE" });
      router.push("/admin/seo/metadata");
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditRunning(true);
    try {
      const res = await fetch("/api/admin/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      if (res.ok) {
        // Refetch page data
        const pageRes = await fetch(`/api/admin/seo/pages/${page.id}`);
        if (pageRes.ok) {
          const updated = await pageRes.json();
          setAuditStatus(updated.auditStatus);
          setAuditNotes(updated.auditNotes);
          setLastAuditedAt(updated.lastAuditedAt);
        }
      }
    } catch {
      // silent
    } finally {
      setAuditRunning(false);
    }
  };

  const handleMarkOk = async () => {
    try {
      await fetch(`/api/admin/seo/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditStatus: "OK", auditNotes: null }),
      });
      setAuditStatus("OK");
      setAuditNotes(null);
    } catch {
      // silent
    }
  };

  // SERP preview values
  const serpTitle = title || page.pagePath;
  const serpDesc = description || "";
  const serpUrl = `carmakler.cz${page.pagePath === "/" ? "" : page.pagePath}`;

  // OG preview values
  const ogPreviewTitle = ogTitle || title || page.pagePath;
  const ogPreviewDesc = ogDescription || description || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/admin/seo/metadata")}
          className="text-sm text-gray-500 hover:text-orange-600 transition-colors bg-transparent border-none cursor-pointer p-0 mb-3 block"
        >
          &larr; Zpět na seznam
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
          Editace SEO: {page.pagePath}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Sekce: {page.section}</span>
          <span>·</span>
          <span>Typ: {page.pageType}</span>
          <span>·</span>
          <SeoStatusBadge status={auditStatus} />
        </div>
      </div>

      {/* SERP Preview */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Google SERP náhled
        </h3>
        <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-xl">
          <div className="text-[18px] text-blue-700 font-medium leading-snug truncate">
            {serpTitle}
          </div>
          <div className="text-[13px] text-green-800 mt-1 truncate">
            {serpUrl}
          </div>
          <div className="text-[13px] text-gray-600 mt-1 line-clamp-2">
            {serpDesc || <span className="text-gray-300 italic">Žádný popis</span>}
          </div>
        </div>
      </Card>

      {/* Meta fields */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Meta title &amp; description
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                Meta title
              </label>
              <span className={cn("text-[12px] font-medium", getCharColor(title.length, 60))}>
                {title.length}/60
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meta title stránky"
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                Meta description
              </label>
              <span className={cn("text-[12px] font-medium", getCharColor(description.length, 160))}>
                {description.length}/160
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meta description stránky"
              rows={3}
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Canonical + noIndex */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Indexace
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              Canonical URL
            </label>
            <input
              type="text"
              value={canonical}
              onChange={(e) => setCanonical(e.target.value)}
              placeholder={page.pagePath}
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noIndex}
              onChange={(e) => setNoIndex(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 accent-orange-500"
            />
            <span className="text-sm text-gray-700 font-medium">
              noIndex — neindexovat tuto stránku
            </span>
          </label>
        </div>
      </Card>

      {/* Open Graph */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Open Graph
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              OG Title
            </label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="OG title pro social sharing"
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              OG Description
            </label>
            <textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="OG description pro social sharing"
              rows={2}
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              OG Image URL
            </label>
            <input
              type="text"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://carmakler.cz/og/..."
              className="w-full px-4 py-3 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all hover:bg-gray-100 focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none"
            />
          </div>

          {/* OG Preview */}
          <div>
            <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Náhled
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-w-sm bg-white">
              {ogImageUrl && (
                <div className="w-full h-[160px] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ogImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <div className="text-[13px] font-bold text-gray-900 truncate">{ogPreviewTitle}</div>
                <div className="text-[12px] text-gray-500 mt-1 line-clamp-2">{ogPreviewDesc}</div>
                <div className="text-[11px] text-gray-400 mt-1 uppercase">carmakler.cz</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Schema.org — STOP-8: read-only */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
          Schema.org
        </h3>
        {schemaTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {schemaTypes.map((type) => (
              <span key={type} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-[12px] font-bold rounded-lg">
                {type}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Žádné tracked schema typy</p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Informativní — schema typy se editují v kódu, trackují v DB.
        </p>
      </Card>

      {/* Audit section */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
          Audit
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Status:</span>
            <SeoStatusBadge status={auditStatus} />
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Poslední audit: {formatDate(lastAuditedAt)}</span>
          </div>
          {auditNotes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{auditNotes}</pre>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRunAudit} disabled={auditRunning}>
              {auditRunning ? "Probíhá..." : "Spustit audit"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleMarkOk}>
              Označit jako OK
            </Button>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Ukládám..." : "Uložit změny"}
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Mazání..." : "Smazat override"}
        </Button>
      </div>
    </div>
  );
}
