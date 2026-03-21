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

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Chyba při zpracování");
        return;
      }

      setDone(true);
      onAction?.();
    } catch {
      alert("Nepodařilo se provést akci");
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
