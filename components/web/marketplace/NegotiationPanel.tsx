"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Negotiation {
  id: string;
  fromUser: { id: string; firstName: string; lastName: string };
  toUser: { id: string; firstName: string; lastName: string };
  fromRole: string;
  dealerSharePct: number;
  investorSharePct: number;
  message?: string | null;
  status: string;
  round: number;
  createdAt: string;
  respondedAt?: string | null;
}

export interface NegotiationPanelProps {
  opportunityId: string;
  negotiations: Negotiation[];
  currentUserId: string;
  currentUserRole: string;
  /** Callback po úspěšné akci */
  onUpdate?: () => void;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "pending" | "success" | "rejected" }> = {
  PENDING: { label: "Čeká na odpověď", variant: "pending" },
  ACCEPTED: { label: "Přijato", variant: "success" },
  REJECTED: { label: "Zamítnuto", variant: "rejected" },
  SUPERSEDED: { label: "Nahrazeno", variant: "pending" },
  EXPIRED: { label: "Vypršelo", variant: "rejected" },
};

export function NegotiationPanel({
  opportunityId,
  negotiations,
  currentUserId,
  currentUserRole,
  onUpdate,
  className,
}: NegotiationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counterPct, setCounterPct] = useState(50);
  const [counterMessage, setCounterMessage] = useState("");
  const [showCounter, setShowCounter] = useState<string | null>(null);

  const pendingForMe = negotiations.find(
    (n) => n.status === "PENDING" && n.toUser.id === currentUserId
  );

  async function handleRespond(negotiationId: string, action: "ACCEPT" | "REJECT" | "COUNTER") {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { action };
      if (action === "COUNTER") {
        body.dealerSharePct = counterPct;
        if (counterMessage.trim()) body.message = counterMessage.trim();
      }

      const res = await fetch(`/api/marketplace/negotiations/${negotiationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při odpovědi");
      }

      setShowCounter(null);
      setCounterMessage("");
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  // Dealer create new offer
  const [newDealerPct, setNewDealerPct] = useState(50);
  const [newInvestorId, setNewInvestorId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function handleCreate() {
    if (!newInvestorId.trim()) {
      setError("Zadejte ID investora");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          investorId: newInvestorId.trim(),
          dealerSharePct: newDealerPct,
          message: newMessage.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při vytváření nabídky");
      }

      setShowCreate(false);
      setNewMessage("");
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Vyjednávání</h3>
          {currentUserRole === "VERIFIED_DEALER" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? "Zrušit" : "Nová nabídka"}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-50 text-error-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Create new offer — dealer only */}
        {showCreate && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Vytvořit nabídku</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID investora</label>
              <input
                type="text"
                value={newInvestorId}
                onChange={(e) => setNewInvestorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="ID investora"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Váš podíl na zisku: {newDealerPct}% (investor: {100 - newDealerPct}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={newDealerPct}
                onChange={(e) => setNewDealerPct(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zpráva (volitelné)</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
                maxLength={2000}
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={loading}>
              {loading ? "Odesílám..." : "Odeslat nabídku"}
            </Button>
          </div>
        )}

        {/* Negotiation history */}
        {negotiations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Zatím žádné nabídky k vyjednávání.
          </p>
        ) : (
          <div className="space-y-3">
            {negotiations.map((n) => {
              const statusInfo = STATUS_MAP[n.status] || { label: n.status, variant: "pending" as const };
              const isForMe = n.toUser.id === currentUserId && n.status === "PENDING";

              return (
                <div
                  key={n.id}
                  className={`border rounded-xl p-4 ${
                    isForMe ? "border-orange-300 bg-orange-50/50" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Kolo {n.round}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {n.fromUser.firstName} {n.fromUser.lastName} → {n.toUser.firstName} {n.toUser.lastName}
                      </span>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Dealer: <strong>{n.dealerSharePct}%</strong>
                    </span>
                    <span className="text-gray-600">
                      Investor: <strong>{n.investorSharePct}%</strong>
                    </span>
                  </div>

                  {n.message && (
                    <p className="text-sm text-gray-500 mt-2 italic">&ldquo;{n.message}&rdquo;</p>
                  )}

                  {/* Action buttons for pending negotiation addressed to me */}
                  {isForMe && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(n.id, "ACCEPT")}
                        disabled={loading}
                      >
                        Přijmout
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowCounter(showCounter === n.id ? null : n.id)}
                        disabled={loading}
                      >
                        Protinabídka
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRespond(n.id, "REJECT")}
                        disabled={loading}
                      >
                        Odmítnout
                      </Button>
                    </div>
                  )}

                  {/* Counter-offer form */}
                  {showCounter === n.id && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Dealer: {counterPct}% / Investor: {100 - counterPct}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={counterPct}
                        onChange={(e) => setCounterPct(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <textarea
                        value={counterMessage}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Zpráva k protinabídce..."
                        rows={2}
                        maxLength={2000}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRespond(n.id, "COUNTER")}
                        disabled={loading}
                      >
                        {loading ? "Odesílám..." : "Odeslat protinabídku"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
