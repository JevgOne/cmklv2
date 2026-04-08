"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { CommissionRateSlider } from "./CommissionRateSlider";

interface CommissionEditDialogProps {
  open: boolean;
  currentRate: number;
  partnerId: string;
  onClose: () => void;
  onSaved: (newRate: number, newRateAt: string) => void;
}

const REASON_MIN_LENGTH = 10;

export function CommissionEditDialog({
  open,
  currentRate,
  partnerId,
  onClose,
  onSaved,
}: CommissionEditDialogProps) {
  const [newRate, setNewRate] = useState(currentRate);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rateChanged = newRate !== currentRate;
  const reasonValid = reason.trim().length >= REASON_MIN_LENGTH;
  const canSave = rateChanged && reasonValid && !saving;

  function reset() {
    setNewRate(currentRate);
    setReason("");
    setError(null);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/partners/${partnerId}/commission`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newRate, reason: reason.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          typeof data?.error === "string"
            ? data.error
            : "Nepodařilo se uložit změnu sazby.";
        throw new Error(msg);
      }
      const updated = await res.json();
      onSaved(Number(updated.commissionRate), updated.commissionRateAt);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba serveru");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upravit sazbu provize"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? "Ukládám..." : "Uložit změnu"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="text-sm text-gray-600">
          Aktuální sazba:{" "}
          <span className="font-semibold text-gray-900 tabular-nums">
            {currentRate.toFixed(1)} %
          </span>
        </div>

        <CommissionRateSlider
          value={newRate}
          onChange={setNewRate}
          disabled={saving}
        />

        <Textarea
          label="Důvod změny (povinný, min. 10 znaků)"
          placeholder="Např. Volume discount po pilotu Q1, strategic partnership, post-pilot adjustment..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={saving}
          maxLength={500}
          error={
            reason.length > 0 && !reasonValid
              ? `Důvod musí mít alespoň ${REASON_MIN_LENGTH} znaků`
              : undefined
          }
        />

        {!rateChanged && (
          <div className="text-xs text-gray-500">
            Pro uložení posuňte slider na jinou hodnotu.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
