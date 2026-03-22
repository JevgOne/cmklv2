"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface LeadAssignmentProps {
  leadId: string;
  currentBrokerId: string | null;
  brokerOptions: { value: string; label: string }[];
}

export function LeadAssignment({ leadId, currentBrokerId, brokerOptions }: LeadAssignmentProps) {
  const router = useRouter();
  const [selectedBroker, setSelectedBroker] = useState(currentBrokerId ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAssign() {
    if (!selectedBroker) return;
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId: selectedBroker }),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
      // chyba
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Select
        placeholder="Vyberte maklere..."
        options={brokerOptions}
        value={selectedBroker}
        onChange={(e) => setSelectedBroker(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        disabled={!selectedBroker || selectedBroker === currentBrokerId || loading}
        onClick={handleAssign}
        className="w-full"
      >
        {loading ? "Prirazuji..." : success ? "Prirazeno!" : "Priradit makleri"}
      </Button>
    </div>
  );
}
