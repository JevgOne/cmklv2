"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SignatureCanvas } from "@/components/pwa/contracts/SignatureCanvas";

interface ExtendExclusiveModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
}

const durationOptions = [
  { value: "1", label: "1 měsíc" },
  { value: "2", label: "2 měsíce" },
  { value: "3", label: "3 měsíce" },
  { value: "6", label: "6 měsíců" },
];

export function ExtendExclusiveModal({
  open,
  onClose,
  vehicleId,
}: ExtendExclusiveModalProps) {
  const router = useRouter();
  const [duration, setDuration] = useState("3");
  const [sellerSignature, setSellerSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerSignature) {
      setError("Podpis prodejce je povinný");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/extend-exclusive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration,
            sellerSignature,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se prodloužit exkluzivitu");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se prodloužit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Prodloužit exkluzivitu">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doba prodloužení
          </label>
          <div className="grid grid-cols-2 gap-2">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`p-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  duration === opt.value
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setDuration(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Podpis prodejce
          </label>
          {sellerSignature ? (
            <div className="flex flex-col items-center gap-2">
              <div className="border-2 border-green-200 rounded-lg p-2 bg-green-50 w-full text-center">
                <p className="text-sm text-green-700 font-medium">
                  Podpis potvrzen
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setSellerSignature(null)}
              >
                Podepsat znovu
              </Button>
            </div>
          ) : (
            <SignatureCanvas
              onConfirm={(base64) => setSellerSignature(base64)}
            />
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            Zrušit
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !sellerSignature}
            className="flex-1"
          >
            {submitting ? "Prodlužuji..." : "Prodloužit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
