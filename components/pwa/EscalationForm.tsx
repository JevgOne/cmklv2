"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";

const ESCALATION_TYPE_OPTIONS = [
  { value: "SELLER_ISSUE", label: "Problém s prodejcem" },
  { value: "FRAUD_SUSPICION", label: "Podezření na podvod" },
  { value: "TECHNICAL", label: "Technický problém" },
  { value: "EXCLUSIVITY_VIOLATION", label: "Porušení exkluzivity" },
  { value: "OTHER", label: "Jiné" },
];

interface EscalationFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId?: string;
  contactId?: string;
  onSuccess?: () => void;
}

export function EscalationForm({
  open,
  onClose,
  vehicleId,
  contactId,
  onSuccess,
}: EscalationFormProps) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!type) {
      setError("Vyberte typ problému");
      return;
    }
    if (description.length < 10) {
      setError("Popis musí mít alespoň 10 znaků");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          urgency: urgent ? "URGENT" : "NORMAL",
          description,
          vehicleId: vehicleId || null,
          contactId: contactId || null,
        }),
      });

      if (res.ok) {
        setType("");
        setDescription("");
        setUrgent(false);
        onClose();
        onSuccess?.();
      } else {
        const data = await res.json();
        setError(data.error || "Nepodařilo se odeslat eskalaci");
      }
    } catch {
      setError("Chyba serveru");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nahlásit problém"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Odesílám..." : "Odeslat"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Typ problému"
          options={ESCALATION_TYPE_OPTIONS}
          placeholder="Vyberte typ..."
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <Textarea
          label="Popis problému"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Popište problém co nejpodrobněji (min. 10 znaků)..."
          rows={4}
        />

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-gray-900">
              Urgentní
            </div>
            <div className="text-xs text-gray-500">
              Urgentní eskalace budou okamžitě nahlášeny manažerovi i BackOffice
            </div>
          </div>
          <Toggle checked={urgent} onChange={setUrgent} />
        </div>

        {vehicleId && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Propojeno s vozidlem: {vehicleId}
          </div>
        )}

        {contactId && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Propojeno s kontaktem: {contactId}
          </div>
        )}

        {error && (
          <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
