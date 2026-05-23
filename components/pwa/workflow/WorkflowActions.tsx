"use client";

import { useState } from "react";
import { getAllowedTransitions } from "@/lib/workflow/state-machine";
import type { WorkflowStatus } from "@/lib/workflow/types";

const statusLabels: Record<string, string> = {
  CREATED: "Vytvořeno",
  ASSIGNED: "Přiřazeno",
  IN_PROGRESS: "Řeší se",
  WAITING_INFO: "Čeká na info",
  WAITING_APPROVAL: "Ke schválení",
  RESOLVED: "Vyřešeno",
  CLOSED: "Uzavřeno",
  CANCELLED: "Zrušeno",
};

interface WorkflowActionsProps {
  currentStatus: WorkflowStatus;
  userRole: string;
  isCreator: boolean;
  onStatusChange: (newStatus: WorkflowStatus, resolution?: string) => Promise<void>;
}

export function WorkflowActions({
  currentStatus,
  userRole,
  isCreator,
  onStatusChange,
}: WorkflowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [resolution, setResolution] = useState("");

  const allowedTransitions = getAllowedTransitions(currentStatus, userRole, isCreator);

  if (allowedTransitions.length === 0) return null;

  const handleTransition = async (to: WorkflowStatus) => {
    if (to === "RESOLVED" && !showResolution) {
      setShowResolution(true);
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(to, to === "RESOLVED" ? resolution : undefined);
      setShowResolution(false);
      setResolution("");
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (status: WorkflowStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-orange-500 text-white hover:bg-orange-600";
      case "RESOLVED":
        return "bg-green-500 text-white hover:bg-green-600";
      case "CLOSED":
        return "bg-gray-600 text-white hover:bg-gray-700";
      case "CANCELLED":
        return "bg-red-100 text-red-600 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  return (
    <div className="space-y-3">
      {showResolution && (
        <div className="space-y-2">
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Popis řešení..."
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-300 focus:ring-1 focus:ring-green-300 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleTransition("RESOLVED" as WorkflowStatus)}
              disabled={loading || !resolution.trim()}
              className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-green-600 transition-colors"
            >
              {loading ? "Ukládám..." : "Potvrdit vyřešení"}
            </button>
            <button
              onClick={() => { setShowResolution(false); setResolution(""); }}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {!showResolution && (
        <div className="flex flex-wrap gap-2">
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleTransition(status)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${getButtonStyle(status)}`}
            >
              {loading ? "..." : statusLabels[status] || status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
