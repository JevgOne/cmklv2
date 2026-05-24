"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeoStatusBadge } from "./SeoStatusBadge";
import Link from "next/link";

interface AuditIssue {
  pagePath: string;
  severity: "ERROR" | "WARNING";
  rule: string;
  message: string;
}

interface AuditResult {
  score: number;
  ok: number;
  warnings: number;
  errors: number;
  issues: AuditIssue[];
}

interface AuditRunResult {
  audited: number;
  ok: number;
  warnings: number;
  errors: number;
}

interface SeoAuditRunnerProps {
  initialResult: AuditResult;
}

const SECTIONS = ["vehicles", "parts", "blog", "stk", "services", "legal", "info", "marketplace", "brokers", "home", "listings"];

export function SeoAuditRunner({ initialResult }: SeoAuditRunnerProps) {
  const [result, setResult] = useState<AuditResult>(initialResult);
  const [running, setRunning] = useState(false);
  const [scope, setScope] = useState<"all" | "section">("all");
  const [section, setSection] = useState("");
  const [lastRun, setLastRun] = useState<AuditRunResult | null>(null);
  const [filter, setFilter] = useState<"all" | "ERROR" | "WARNING">("all");

  const handleRunAudit = async () => {
    setRunning(true);
    setLastRun(null);
    try {
      const body: Record<string, string> = { scope };
      if (scope === "section" && section) body.section = section;

      const res = await fetch("/api/admin/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const runResult = await res.json();
        setLastRun(runResult);

        // Refresh the health score
        const healthRes = await fetch("/api/admin/seo/audit");
        if (healthRes.ok) {
          setResult(await healthRes.json());
        }
      }
    } catch {
      // silent
    } finally {
      setRunning(false);
    }
  };

  const filteredIssues = filter === "all"
    ? result.issues
    : result.issues.filter((i) => i.severity === filter);

  const errorCount = result.issues.filter((i) => i.severity === "ERROR").length;
  const warningCount = result.issues.filter((i) => i.severity === "WARNING").length;

  return (
    <div className="space-y-6">
      {/* Run audit controls */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Spustit audit
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              Rozsah
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "all" | "section")}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Celý web</option>
              <option value="section">Vybraná sekce</option>
            </select>
          </div>

          {scope === "section" && (
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Sekce
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Vyberte sekci</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" size="sm" onClick={handleRunAudit} disabled={running}>
            {running ? "Probíhá audit..." : "Spustit audit"}
          </Button>
        </div>

        {/* Last run result */}
        {lastRun && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              Audit dokončen: {lastRun.audited} stránek auditováno —{" "}
              {lastRun.ok} OK, {lastRun.warnings} varování, {lastRun.errors} chyb
            </p>
          </div>
        )}
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-[28px] font-extrabold text-gray-900">{result.score}</div>
          <div className="text-xs text-gray-500 mt-1">Health skóre</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-extrabold text-green-600">{result.ok}</div>
          <div className="text-xs text-gray-500 mt-1">OK</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-extrabold text-amber-600">{result.warnings}</div>
          <div className="text-xs text-gray-500 mt-1">Varování</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-extrabold text-red-600">{result.errors}</div>
          <div className="text-xs text-gray-500 mt-1">Chyby</div>
        </Card>
      </div>

      {/* Issues list */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Nalezené problémy ({filteredIssues.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Vše ({result.issues.length})
            </button>
            <button
              onClick={() => setFilter("ERROR")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === "ERROR" ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
            >
              Chyby ({errorCount})
            </button>
            <button
              onClick={() => setFilter("WARNING")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === "WARNING" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
            >
              Varování ({warningCount})
            </button>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Žádné problémy nenalezeny
          </p>
        ) : (
          <div className="space-y-2">
            {filteredIssues.map((issue, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SeoStatusBadge status={issue.severity} className="shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/seo/metadata?q=${encodeURIComponent(issue.pagePath)}`}
                      className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors no-underline"
                    >
                      {issue.pagePath}
                    </Link>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
