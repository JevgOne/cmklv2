"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";

interface CommunicationFormProps {
  contactId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TYPE_OPTIONS = [
  { value: "CALL", label: "Hovor" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Schuzka" },
  { value: "NOTE", label: "Poznamka" },
];

const DIRECTION_OPTIONS = [
  { value: "OUTGOING", label: "Odchozi" },
  { value: "INCOMING", label: "Prichozi" },
];

const RESULT_OPTIONS = [
  { value: "", label: "— Bez vysledku —" },
  { value: "INTERESTED", label: "Zajem" },
  { value: "NOT_NOW", label: "Ted ne" },
  { value: "REJECTED", label: "Odmitnuti" },
  { value: "FOLLOW_UP", label: "Follow-up" },
];

export function CommunicationForm({
  contactId,
  onSuccess,
  onCancel,
}: CommunicationFormProps) {
  const [type, setType] = useState("CALL");
  const [direction, setDirection] = useState("OUTGOING");
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState("");
  const [duration, setDuration] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showDirection = type === "CALL" || type === "SMS";
  const showDuration = type === "CALL";
  const showFollowUp = result === "FOLLOW_UP";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Popis je povinny");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        type,
        summary: summary.trim(),
      };

      if (showDirection) body.direction = direction;
      if (showDuration && duration) body.duration = parseInt(duration, 10);
      if (result) body.result = result;
      if (showFollowUp && nextFollowUp) {
        body.nextFollowUp = new Date(nextFollowUp).toISOString();
        if (followUpNote.trim()) body.followUpNote = followUpNote.trim();
      }

      const res = await fetch(`/api/contacts/${contactId}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Chyba pri ukladani");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznama chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Typ"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />

      {showDirection && (
        <Select
          label="Smer"
          options={DIRECTION_OPTIONS}
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        />
      )}

      <Textarea
        label="Popis"
        placeholder="Strucny popis komunikace..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
        className="min-h-[80px]"
      />

      {showDuration && (
        <Input
          label="Delka hovoru (sekundy)"
          type="number"
          placeholder="120"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      )}

      <Select
        label="Vysledek"
        options={RESULT_OPTIONS}
        value={result}
        onChange={(e) => setResult(e.target.value)}
      />

      {showFollowUp && (
        <>
          <Input
            label="Datum dalsiho kontaktu"
            type="datetime-local"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
          />
          <Input
            label="Poznamka k follow-upu"
            placeholder="Co pripravit..."
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
          />
        </>
      )}

      {error && <p className="text-sm text-error-500">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Ukladam..." : "Ulozit"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Zrusit
          </Button>
        )}
      </div>
    </form>
  );
}
