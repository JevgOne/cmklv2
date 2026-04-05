"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface OnboardingBroker {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string | null;
  ico?: string;
  bio?: string;
  specializations: string[];
  cities: string[];
  quizScore?: number;
  quizTotal?: number;
  documentsUploaded: boolean;
  contractSigned: boolean;
  onboardingStep: string;
  createdAt: string;
}

interface BrokerApprovalCardProps {
  broker: OnboardingBroker;
  onActivate?: (id: string) => void;
  onReject?: (id: string) => void;
}

const stepLabels: Record<string, string> = {
  PROFILE: "Profil",
  DOCUMENTS: "Dokumenty",
  TRAINING: "Školení",
  CONTRACT: "Smlouva",
  PENDING: "Čeká na schválení",
};

export function BrokerApprovalCard({ broker, onActivate, onReject }: BrokerApprovalCardProps) {
  const [loading, setLoading] = useState<"activate" | "reject" | null>(null);
  const [error, setError] = useState("");

  const handleActivate = async () => {
    setLoading("activate");
    setError("");
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}/activate`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Aktivace se nezdařila.");
        setLoading(null);
        return;
      }
      onActivate?.(broker.id);
    } catch {
      setError("Došlo k chybě.");
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirm("Opravdu chcete zamítnout tohoto makléře?")) return;
    setLoading("reject");
    setError("");
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}/reject`, { method: "POST" });
      if (!res.ok) {
        setError("Zamítnutí se nezdařilo.");
        setLoading(null);
        return;
      }
      onReject?.(broker.id);
    } catch {
      setError("Došlo k chybě.");
      setLoading(null);
    }
  };

  const isPending = broker.onboardingStep === "PENDING";

  return (
    <Card className="p-5">
      {error && (
        <Alert variant="error" className="mb-4">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0">
          {broker.avatar ? (
            
            <Image src={broker.avatar} alt={broker.name} fill className="rounded-xl object-cover" sizes="56px" />
          ) : (
            broker.initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{broker.name}</h3>
            <Badge variant={isPending ? "pending" : "new"}>
              {stepLabels[broker.onboardingStep] || broker.onboardingStep}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{broker.email}</p>
          {broker.phone && <p className="text-sm text-gray-500">{broker.phone}</p>}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        {broker.ico && (
          <div>
            <span className="text-gray-400 text-xs uppercase font-semibold">IČO</span>
            <p className="text-gray-700">{broker.ico}</p>
          </div>
        )}
        {broker.specializations.length > 0 && (
          <div>
            <span className="text-gray-400 text-xs uppercase font-semibold">Specializace</span>
            <p className="text-gray-700">{broker.specializations.join(", ")}</p>
          </div>
        )}
        {broker.cities.length > 0 && (
          <div>
            <span className="text-gray-400 text-xs uppercase font-semibold">Města</span>
            <p className="text-gray-700">{broker.cities.join(", ")}</p>
          </div>
        )}
        {broker.quizScore !== undefined && (
          <div>
            <span className="text-gray-400 text-xs uppercase font-semibold">Kvíz</span>
            <p className="text-gray-700">
              {broker.quizScore}/{broker.quizTotal}
              {broker.quizScore >= (broker.quizTotal ?? 10) * 0.8 ? (
                <span className="text-success-500 ml-1">Splněno</span>
              ) : (
                <span className="text-error-500 ml-1">Nesplněno</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex gap-2 mt-4">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${broker.documentsUploaded ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-400"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {broker.documentsUploaded ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          Dokumenty
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${broker.contractSigned ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-400"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {broker.contractSigned ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          Smlouva
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="danger"
            size="sm"
            onClick={handleReject}
            disabled={loading !== null}
            className="flex-1"
          >
            {loading === "reject" ? "Zamítám..." : "Zamítnout"}
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleActivate}
            disabled={loading !== null}
            className="flex-1"
          >
            {loading === "activate" ? "Aktivuji..." : "Aktivovat"}
          </Button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Registrace: {new Date(broker.createdAt).toLocaleDateString("cs-CZ")}
      </p>
    </Card>
  );
}
