"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface EmailLogEntry {
  id: string;
  templateType: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  createdAt: string;
  sender: { firstName: string; lastName: string } | null;
}

const templateLabels: Record<string, string> = {
  PRESENTATION: "Prezentace",
  CONTRACT_OFFER: "Návrh smlouvy",
  FOLLOWUP: "Follow-up",
  INSURANCE: "Pojištění",
  FINANCING: "Financování",
  PRICE_CHANGE: "Změna ceny",
  VEHICLE_SOLD: "Prodáno",
};

const statusConfig: Record<string, { variant: "verified" | "pending" | "rejected" | "default"; label: string }> = {
  SENT: { variant: "verified", label: "Odesláno" },
  DELIVERED: { variant: "verified", label: "Doručeno" },
  OPENED: { variant: "verified", label: "Přečteno" },
  FAILED: { variant: "rejected", label: "Chyba" },
  BOUNCED: { variant: "rejected", label: "Nedoručeno" },
};

interface EmailHistoryProps {
  vehicleId: string;
}

export function EmailHistory({ vehicleId }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/emails/history/${vehicleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmails(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">Žádné odeslané emaily</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => {
        const status = statusConfig[email.status] || {
          variant: "default" as const,
          label: email.status,
        };
        return (
          <Card key={email.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {templateLabels[email.templateType] || email.templateType}
                  </span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {email.recipientName || email.recipientEmail}
                  {email.recipientName ? ` (${email.recipientEmail})` : ""}
                </p>
              </div>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(email.createdAt).toLocaleDateString("cs-CZ", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
