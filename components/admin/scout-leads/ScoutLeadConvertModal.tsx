"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ScoutLead {
  id: string;
  category: string;
  name: string;
  phone: string | null;
  email: string | null;
  web: string | null;
  city: string | null;
  ico: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
}

export function ScoutLeadConvertModal({
  lead,
  open,
  onClose,
  onConverted,
}: {
  lead: ScoutLead;
  open: boolean;
  onClose: () => void;
  onConverted: (targetType: string, targetId: string) => void;
}) {
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isPartner =
    lead.category === "AUTOBAZAR" || lead.category === "VRAKOVISTE";
  const targetLabel = isPartner ? "Partner" : "Lead (makléřský pipeline)";

  async function handleConvert() {
    setConverting(true);
    setError(null);
    try {
      const res = await fetch(`/api/scout-leads/${lead.id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chyba při konverzi");
        return;
      }
      onConverted(data.targetType, data.targetId);
    } catch {
      setError("Chyba sítě");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Konvertovat na {targetLabel}
        </h3>

        <div className="space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500">Název:</span>
            <span className="font-medium">{lead.name}</span>
          </div>
          {lead.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Telefon:</span>
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span>{lead.email}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex justify-between">
              <span className="text-gray-500">Město:</span>
              <span>{lead.city}</span>
            </div>
          )}
          {isPartner && lead.ico && (
            <div className="flex justify-between">
              <span className="text-gray-500">IČO:</span>
              <span>{lead.ico}</span>
            </div>
          )}
          {!isPartner && lead.vehicleBrand && (
            <div className="flex justify-between">
              <span className="text-gray-500">Vozidlo:</span>
              <span>
                {lead.vehicleBrand} {lead.vehicleModel}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {isPartner
            ? 'Bude vytvořen nový Partner v CRM se stavem "Přiřazený".'
            : 'Bude vytvořen nový Lead v makléřském pipeline se stavem "Nový".'}
        </p>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConvert}
            disabled={converting}
          >
            {converting ? "Konvertuji..." : "Konvertovat"}
          </Button>
        </div>
      </div>
    </div>
  );
}
