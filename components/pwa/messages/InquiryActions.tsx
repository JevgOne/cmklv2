"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { InquiryCardData } from "./InquiryCard";

interface InquiryActionsProps {
  inquiry: InquiryCardData;
  vehicleId: string;
}

export function InquiryActions({ inquiry, vehicleId }: InquiryActionsProps) {
  const router = useRouter();
  const [reply, setReply] = useState(inquiry.reply || "");
  const [viewingDate, setViewingDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"reply" | "viewing" | null>(null);

  const updateInquiry = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/inquiries/${inquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Nepodařilo se aktualizovat");
      }

      router.refresh();
      setActiveAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = () => {
    if (!reply.trim()) return;
    updateInquiry({ reply: reply.trim(), status: "REPLIED" });
  };

  const handleScheduleViewing = () => {
    if (!viewingDate) return;
    updateInquiry({ viewingDate, status: "VIEWING_SCHEDULED" });
  };

  const handleNoInterest = () => {
    updateInquiry({ status: "NO_INTEREST" });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{inquiry.buyerName}</h3>
          <p className="text-xs text-gray-500">{inquiry.buyerPhone}</p>
          {inquiry.buyerEmail && (
            <p className="text-xs text-gray-500">{inquiry.buyerEmail}</p>
          )}
        </div>
        <Badge variant={
          inquiry.status === "NEW" ? "new" :
          inquiry.status === "REPLIED" ? "verified" :
          inquiry.status === "VIEWING_SCHEDULED" ? "top" :
          inquiry.status === "NO_INTEREST" ? "default" : "pending"
        }>
          {inquiry.status === "NEW" ? "Nový" :
           inquiry.status === "REPLIED" ? "Zodpovězeno" :
           inquiry.status === "VIEWING_SCHEDULED" ? "Prohlídka" :
           inquiry.status === "NEGOTIATING" ? "Vyjednávání" :
           inquiry.status === "NO_INTEREST" ? "Bez zájmu" :
           inquiry.status}
        </Badge>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-sm text-gray-700">{inquiry.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(inquiry.createdAt).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {inquiry.reply && !activeAction && (
        <div className="bg-orange-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-orange-600 mb-1">Vaše odpověď:</p>
          <p className="text-sm text-gray-700">{inquiry.reply}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-3">
          {error}
        </div>
      )}

      {/* Akce */}
      {inquiry.status !== "NO_INTEREST" && inquiry.status !== "SOLD" && (
        <div className="space-y-3">
          {activeAction === "reply" ? (
            <div className="space-y-3">
              <Textarea
                label="Odpověď"
                placeholder="Napište odpověď kupujícímu..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveAction(null)} className="flex-1">
                  Zrušit
                </Button>
                <Button variant="primary" size="sm" onClick={handleReply} disabled={submitting || !reply.trim()} className="flex-1">
                  {submitting ? "Odesílám..." : "Odeslat"}
                </Button>
              </div>
            </div>
          ) : activeAction === "viewing" ? (
            <div className="space-y-3">
              <Input
                label="Datum a čas prohlídky"
                type="datetime-local"
                value={viewingDate}
                onChange={(e) => setViewingDate(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveAction(null)} className="flex-1">
                  Zrušit
                </Button>
                <Button variant="primary" size="sm" onClick={handleScheduleViewing} disabled={submitting || !viewingDate} className="flex-1">
                  {submitting ? "Plánuji..." : "Naplánovat"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => setActiveAction("reply")}>
                Odpovědět
              </Button>
              <a href={`tel:${inquiry.buyerPhone}`} className="no-underline">
                <Button variant="success" size="sm">
                  Zavolat
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={() => setActiveAction("viewing")}>
                Naplánovat prohlídku
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNoInterest} disabled={submitting}>
                Bez zájmu
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
