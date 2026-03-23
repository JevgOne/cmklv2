"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ApprovalActionsProps {
  vehicleId: string;
  onAction?: () => void;
}

export function ApprovalActions({ vehicleId, onAction }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (action: "approve" | "reject") => {
    let reason: string | undefined;
    if (action === "reject") {
      const input = prompt("Důvod zamítnutí:");
      if (!input?.trim()) return;
      reason = input.trim();
    }

    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při zpracování");
        return;
      }

      setDone(true);
      onAction?.();
    } catch {
      setError("Nepodařilo se provést akci");
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <div className="text-sm text-success-500 font-semibold">Hotovo</div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {error && <div className="text-xs text-red-500 font-medium">{error}</div>}
      <Button
        variant="success"
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? "..." : "Schválit"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? "..." : "Zamítnout"}
      </Button>
    </div>
  );
}
