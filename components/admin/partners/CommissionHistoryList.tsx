"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  id: string;
  oldRate: number;
  newRate: number;
  reason: string;
  changedAt: string;
  changedBy: { firstName: string; lastName: string; email: string };
}

interface CommissionHistoryListProps {
  partnerId: string;
  reloadKey?: number;
}

const COLLAPSED_LIMIT = 3;

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "právě teď";
  if (diffMin < 60) return `před ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `před ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `před ${diffD} d`;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; data: HistoryEntry[] }
  | { kind: "error"; message: string };

export function CommissionHistoryList({
  partnerId,
  reloadKey = 0,
}: CommissionHistoryListProps) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/partners/${partnerId}/commission/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json() as Promise<HistoryEntry[]>;
      })
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Chyba",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId, reloadKey]);

  if (state.kind === "loading") {
    return (
      <div className="mt-4 text-sm text-gray-500">Načítám historii...</div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="mt-4 text-sm text-red-600">
        Nepodařilo se načíst historii ({state.message}).
      </div>
    );
  }

  const history = state.data;

  if (history.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500">Žádné změny sazby.</div>
    );
  }

  const visible = expanded ? history : history.slice(0, COLLAPSED_LIMIT);
  const hiddenCount = history.length - visible.length;

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
        Historie změn ({history.length})
      </h4>
      <ul className="space-y-2">
        {visible.map((entry) => {
          const direction = entry.newRate > entry.oldRate ? "↑" : "↓";
          const directionColor =
            entry.newRate > entry.oldRate ? "text-red-600" : "text-green-600";
          const author =
            `${entry.changedBy.firstName} ${entry.changedBy.lastName}`.trim() ||
            entry.changedBy.email;
          return (
            <li
              key={entry.id}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold text-gray-900 tabular-nums">
                  {entry.oldRate.toFixed(1)} %{" "}
                  <span className={directionColor}>{direction}</span>{" "}
                  {entry.newRate.toFixed(1)} %
                </div>
                <div className="text-xs text-gray-500">
                  {formatRelative(entry.changedAt)}
                </div>
              </div>
              <div className="mt-1 text-gray-700">{entry.reason}</div>
              <div className="mt-1 text-xs text-gray-500">{author}</div>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          Zobrazit všech {history.length}
        </button>
      )}
      {expanded && history.length > COLLAPSED_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          Skrýt
        </button>
      )}
    </div>
  );
}
