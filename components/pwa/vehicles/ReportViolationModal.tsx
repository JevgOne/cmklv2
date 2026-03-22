"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface ReportViolationModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
}

export function ReportViolationModal({
  open,
  onClose,
  vehicleId,
}: ReportViolationModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Popis poruseni je povinny");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/report-violation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            evidenceUrl: evidenceUrl || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodarilo se nahlasit poruseni");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodarilo se nahlasit poruseni"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nahlasit poruseni exkluzivity">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Popis poruseni
          </label>
          <textarea
            className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            rows={4}
            placeholder="Prodejce inzeruje auto na jinych portalech..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <Input
          label="URL kde je auto inzerovano"
          type="url"
          placeholder="https://bazos.cz/..."
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
        />

        <p className="text-xs text-gray-500">
          Informace bude odeslana vasemu manazerovi a BackOffice k provereni.
        </p>

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
            disabled={submitting || !description.trim()}
            className="flex-1"
          >
            {submitting ? "Odesilam..." : "Nahlasit poruseni"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
