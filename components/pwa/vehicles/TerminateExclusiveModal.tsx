"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface TerminateExclusiveModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  penaltyAmount?: number | null;
}

const reasonOptions = [
  { value: "SELLER_CHANGED_MIND", label: "Prodejce si to rozmyslel" },
  { value: "SELLER_SOLD_PRIVATELY", label: "Prodejce prodal sam" },
  { value: "VEHICLE_UNDRIVABLE", label: "Auto nepojizdne" },
  { value: "OTHER", label: "Jiny duvod" },
];

export function TerminateExclusiveModal({
  open,
  onClose,
  vehicleId,
  penaltyAmount,
}: TerminateExclusiveModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Vyberte duvod ukonceni");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/terminate-exclusive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            note: note || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodarilo se ukoncit smlouvu");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodarilo se ukoncit smlouvu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ukoncit exkluzivni smlouvu">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {penaltyAmount && reason === "SELLER_SOLD_PRIVATELY" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          Pozor: smluvni pokuta{" "}
          {new Intl.NumberFormat("cs-CZ").format(penaltyAmount)} Kc dle smlouvy
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duvod ukonceni
          </label>
          <div className="flex flex-col gap-2">
            {reasonOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`p-3 rounded-xl text-sm font-medium text-left border-2 transition-all ${
                  reason === opt.value
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setReason(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poznamka
          </label>
          <textarea
            className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            rows={3}
            placeholder="Volitelna poznamka..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            Zrusit
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={submitting || !reason}
            className="flex-1"
          >
            {submitting ? "Ukoncuji..." : "Ukoncit smlouvu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
