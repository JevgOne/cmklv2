"use client";

import { Card } from "@/components/ui/Card";
import { SeoStatusBadge } from "./SeoStatusBadge";
import Link from "next/link";

interface AuditIssue {
  pagePath: string;
  severity: "ERROR" | "WARNING";
  rule: string;
  message: string;
}

interface SectionCount {
  section: string;
  _count: number;
}

interface RecentChange {
  pagePath: string;
  updatedAt: string;
  title: string | null;
}

interface SeoHealthCardsProps {
  score: number;
  ok: number;
  warnings: number;
  errors: number;
  issues: AuditIssue[];
  recentChanges: RecentChange[];
  sectionCoverage: SectionCount[];
  sectionTotals: SectionCount[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function SeoHealthCards({
  score,
  ok,
  warnings,
  errors,
  issues,
  recentChanges,
  sectionCoverage,
  sectionTotals,
}: SeoHealthCardsProps) {
  const coverageMap = new Map(sectionCoverage.map((s) => [s.section, s._count]));
  const totalsMap = new Map(sectionTotals.map((s) => [s.section, s._count]));
  const sections = Array.from(totalsMap.keys()).sort();

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[22px] bg-gray-100">
              <svg className="w-7 h-7" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-gray-200" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                  className={getScoreRingColor(score)}
                  strokeDasharray={`${score} ${100 - score}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className={`text-[32px] font-extrabold mb-1 ${getScoreColor(score)}`}>{score}</div>
          <div className="text-sm text-gray-500">Health skóre</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[22px] bg-green-100">
              <span>&#10003;</span>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-gray-900 mb-1">{ok}</div>
          <div className="text-sm text-gray-500">OK stránek</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[22px] bg-amber-100">
              <span>!</span>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-amber-600 mb-1">{warnings}</div>
          <div className="text-sm text-gray-500">Varování</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[22px] bg-red-100">
              <span>&times;</span>
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-red-600 mb-1">{errors}</div>
          <div className="text-sm text-gray-500">Chyby</div>
        </Card>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Problémy k řešení
          </h3>
          <div className="space-y-3">
            {issues.slice(0, 10).map((issue, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <SeoStatusBadge status={issue.severity} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <Link
                    href={`/admin/seo/metadata?q=${encodeURIComponent(issue.pagePath)}`}
                    className="font-medium text-gray-900 hover:text-orange-600 transition-colors no-underline"
                  >
                    {issue.pagePath}
                  </Link>
                  <span className="text-gray-500 ml-2">— {issue.message}</span>
                </div>
              </div>
            ))}
          </div>
          {issues.length > 10 && (
            <Link
              href="/admin/seo/metadata?status=ERROR"
              className="inline-block mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 no-underline"
            >
              Zobrazit vše ({issues.length}) &rarr;
            </Link>
          )}
        </Card>
      )}

      {/* Bottom row: coverage + recent changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section coverage */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Pokrytí podle sekce
          </h3>
          <div className="space-y-3">
            {sections.map((section) => {
              const total = totalsMap.get(section) || 1;
              const okCount = coverageMap.get(section) || 0;
              const pct = Math.round((okCount / total) * 100);
              return (
                <div key={section}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{section}</span>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent changes */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Poslední změny
          </h3>
          {recentChanges.length === 0 ? (
            <p className="text-sm text-gray-500">Žádné nedávné změny</p>
          ) : (
            <div className="space-y-3">
              {recentChanges.map((change, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900 truncate block">{change.pagePath}</span>
                    {change.title && (
                      <span className="text-gray-400 text-xs truncate block">{change.title}</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs shrink-0 ml-3">
                    {formatRelativeTime(change.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
