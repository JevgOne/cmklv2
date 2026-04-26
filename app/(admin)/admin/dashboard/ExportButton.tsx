"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

const EXPORT_OPTIONS = [
  { type: "vehicles", label: "Vozidla" },
  { type: "brokers", label: "Makléři" },
  { type: "commissions", label: "Provize" },
] as const;

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error("Export selhal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export se nezdařil. Zkuste to znovu.");
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        Export
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          {EXPORT_OPTIONS.map((item) => (
            <button
              key={item.type}
              onClick={() => handleExport(item.type)}
              disabled={!!exporting}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {exporting === item.type ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  Exportuji...
                </span>
              ) : (
                `${item.label} (CSV)`
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
