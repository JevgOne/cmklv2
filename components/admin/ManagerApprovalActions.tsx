"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ManagerApprovalActionsProps {
  vehicleId: string;
}

type ActionType = "approve" | "return" | "reject";

export function ManagerApprovalActions({ vehicleId }: ManagerApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionType | null>(null);
  const [modalAction, setModalAction] = useState<"return" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const handleAction = async (action: ActionType, actionReason?: string) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/manager/vehicles/${vehicleId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: actionReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Chyba při zpracování");
        return;
      }

      setDone(true);
      setModalAction(null);
      router.refresh();
    } catch {
      alert("Nepodařilo se provést akci");
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <div className="text-sm text-success-500 font-semibold py-2">
        Akce provedena
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => handleAction("approve")}
          disabled={loading !== null}
        >
          {loading === "approve" ? "..." : "Schvalit"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalAction("return")}
          disabled={loading !== null}
          className="!text-warning-500 !shadow-[inset_0_0_0_2px_var(--warning-500)]"
        >
          Vratit k dopracovani
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setModalAction("reject")}
          disabled={loading !== null}
        >
          Zamitnout
        </Button>
      </div>

      {/* Modal for reason */}
      {modalAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {modalAction === "return"
                ? "Vratit k dopracovani"
                : "Zamitnout vozidlo"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modalAction === "return"
                ? "Napiste duvod, proc je potreba vozidlo dopracovat."
                : "Napiste duvod zamitnutí."}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Duvod..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setModalAction(null);
                  setReason("");
                }}
                disabled={loading !== null}
              >
                Zrusit
              </Button>
              <Button
                variant={modalAction === "return" ? "primary" : "danger"}
                size="sm"
                onClick={() => handleAction(modalAction, reason)}
                disabled={loading !== null || !reason.trim()}
              >
                {loading === modalAction
                  ? "..."
                  : modalAction === "return"
                    ? "Vratit"
                    : "Zamitnout"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
