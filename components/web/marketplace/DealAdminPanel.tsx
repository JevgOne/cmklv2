"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface DealAdminPanelProps {
  opportunityId: string;
  currentStatus: string;
  adminNotes: string | null;
  actualSalePrice: number | null;
}

const ALL_STATUSES = [
  { value: "PENDING_APPROVAL", label: "Čeká na schválení" },
  { value: "APPROVED", label: "Schváleno" },
  { value: "FUNDING", label: "Financování" },
  { value: "FUNDED", label: "Financováno" },
  { value: "IN_REPAIR", label: "V opravě" },
  { value: "FOR_SALE", label: "Na prodej" },
  { value: "SOLD", label: "Prodáno" },
  { value: "PAYOUT_PENDING", label: "Čeká na výplatu" },
  { value: "COMPLETED", label: "Dokončeno" },
  { value: "CANCELLED", label: "Zrušeno" },
];

export function DealAdminPanel({
  opportunityId,
  currentStatus,
  adminNotes: initialNotes,
  actualSalePrice: initialActualPrice,
}: DealAdminPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [actualPrice, setActualPrice] = useState(
    initialActualPrice ? String(initialActualPrice) : ""
  );
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const isPendingApproval = currentStatus === "PENDING_APPROVAL";
  const isSold = currentStatus === "SOLD";

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage("");
    try {
      const body: Record<string, unknown> = { adminNotes: notes };
      if (status !== currentStatus) body.status = status;
      if (actualPrice) body.actualSalePrice = parseInt(actualPrice, 10);

      const res = await fetch(
        `/api/marketplace/opportunities/${opportunityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        setMessage("Uloženo");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "Chyba při ukládání");
      }
    } catch {
      setMessage("Chyba při ukládání");
    } finally {
      setSaving(false);
    }
  }, [opportunityId, status, currentStatus, notes, actualPrice, router]);

  const handleApprove = useCallback(
    async (approved: boolean) => {
      setApproving(true);
      setMessage("");
      try {
        const res = await fetch(
          `/api/marketplace/opportunities/${opportunityId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              approved,
              reason: approved ? undefined : rejectionReason,
            }),
          }
        );

        if (res.ok) {
          setMessage(approved ? "Schváleno" : "Zamítnuto");
          router.refresh();
        } else {
          const data = await res.json();
          setMessage(data.error || "Chyba");
        }
      } catch {
        setMessage("Chyba");
      } finally {
        setApproving(false);
      }
    },
    [opportunityId, rejectionReason, router]
  );

  const handlePayout = useCallback(async () => {
    const price = parseInt(actualPrice, 10);
    if (!price || price <= 0) {
      setMessage("Zadejte skutečnou prodejní cenu");
      return;
    }

    setPayingOut(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/marketplace/opportunities/${opportunityId}/payout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actualSalePrice: price }),
        }
      );

      if (res.ok) {
        setMessage("Výplata provedena");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "Chyba při výplatě");
      }
    } catch {
      setMessage("Chyba při výplatě");
    } finally {
      setPayingOut(false);
    }
  }, [opportunityId, actualPrice, router]);

  return (
    <Card className="p-5 border-purple-200 bg-purple-50">
      <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 text-purple-600"
        >
          <path
            fillRule="evenodd"
            d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
        Admin panel
      </h3>

      {message && (
        <div className="mb-4 px-3 py-2 bg-white rounded-lg text-sm font-medium text-purple-700">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Status dropdown */}
        <div>
          <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Admin notes */}
        <div>
          <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">
            Admin poznámky
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
            placeholder="Interní poznámky..."
          />
        </div>

        {/* Actual sale price */}
        {["SOLD", "PAYOUT_PENDING", "COMPLETED"].includes(currentStatus) && (
          <div>
            <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1.5">
              Skutečná prodejní cena (Kč)
            </label>
            <input
              type="number"
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="Např. 395000"
            />
          </div>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="primary"
          className="w-full"
        >
          {saving ? "Ukládám..." : "Uložit změny"}
        </Button>

        {/* Approve/Reject (PENDING_APPROVAL only) */}
        {isPendingApproval && (
          <div className="border-t border-purple-200 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-purple-900">
              Schválení flipu
            </h4>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
              placeholder="Důvod zamítnutí (volitelné)..."
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleApprove(true)}
                disabled={approving}
                variant="primary"
                className="flex-1"
              >
                {approving ? "..." : "Schválit"}
              </Button>
              <button
                onClick={() => handleApprove(false)}
                disabled={approving}
                className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                Zamítnout
              </button>
            </div>
          </div>
        )}

        {/* Payout (SOLD only) */}
        {isSold && (
          <div className="border-t border-purple-200 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-purple-900">
              Výplata investorům
            </h4>
            <p className="text-xs text-purple-600">
              Po zadání skutečné prodejní ceny a kliknutí na &quot;Vyplatit&quot;
              se automaticky vypočítají podíly a změní se status na COMPLETED.
            </p>
            <Button
              onClick={handlePayout}
              disabled={payingOut || !actualPrice}
              variant="primary"
              className="w-full"
            >
              {payingOut ? "Vyplácím..." : "Vyplatit investory"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
