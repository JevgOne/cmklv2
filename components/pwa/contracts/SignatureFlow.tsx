"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SignatureCanvas } from "./SignatureCanvas";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface SignatureFlowProps {
  contractId: string;
  sellerName: string;
  brokerName: string;
  vehicleName?: string;
}

type Step = "seller" | "broker";

export function SignatureFlow({
  contractId,
  sellerName: sellerNameDefault,
  brokerName: brokerNameDefault,
  vehicleName,
}: SignatureFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("seller");

  const [sellerName, setSellerName] = useState(sellerNameDefault);
  const [sellerSignature, setSellerSignature] = useState("");
  const [sellerAgreed, setSellerAgreed] = useState(false);

  const [brokerName, setBrokerName] = useState(brokerNameDefault);
  const [brokerSignature, setBrokerSignature] = useState("");
  const [brokerAgreed, setBrokerAgreed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSellerValid =
    sellerName.trim().length > 0 &&
    sellerSignature.length > 0 &&
    sellerAgreed;

  const isBrokerValid =
    brokerName.trim().length > 0 &&
    brokerSignature.length > 0 &&
    brokerAgreed;

  const handleSellerConfirm = useCallback(() => {
    setStep("broker");
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    // Capture geolocation
    let signedLocation: string | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      signedLocation = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      // Geolocation not available or denied
    }

    const signedAt = new Date().toISOString();

    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerSignature,
          brokerSignature,
          sellerName,
          brokerName,
          signedAt,
          signedLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při podpisu smlouvy");
      }

      router.push(`/makler/contracts/${contractId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
      setIsSubmitting(false);
    }
  }, [contractId, sellerSignature, brokerSignature, sellerName, brokerName, router]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (step === "broker") {
                  setStep("seller");
                } else {
                  router.back();
                }
              }}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Zpět"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Podpis smlouvy</h1>
            <button
              onClick={() => router.push(`/makler/contracts/${contractId}`)}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Zavřít"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === "seller"
                  ? "bg-orange-500 text-white"
                  : "bg-success-100 text-success-600"
              }`}
            >
              {step === "broker" ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-orange-500 transition-all duration-300 ${
                  step === "broker" ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                step === "broker"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {vehicleName && (
          <Card className="p-4">
            <p className="text-sm text-gray-500">Vozidlo</p>
            <p className="font-semibold text-gray-900">{vehicleName}</p>
          </Card>
        )}

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {step === "seller" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Podpis prodejce
            </h3>
            <p className="text-sm text-gray-500">
              Předejte telefon prodejci k podpisu
            </p>
            <Input
              label="Jméno a příjmení"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Jan Novak"
            />
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Podpis
              </label>
              <SignatureCanvas
                onConfirm={(base64) => setSellerSignature(base64)}
              />
            </div>
            {sellerSignature && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Podpis uložen
              </div>
            )}
            <Checkbox
              label="Souhlasím s podmínkami smlouvy"
              checked={sellerAgreed}
              onChange={(e) => setSellerAgreed(e.target.checked)}
            />
          </div>
        )}

        {step === "broker" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Podpis makléře
            </h3>
            <p className="text-sm text-gray-500">
              Nyní podepište Vy jako makléř
            </p>
            <Input
              label="Jméno a příjmení"
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              placeholder="Jan Novak"
            />
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Podpis
              </label>
              <SignatureCanvas
                onConfirm={(base64) => setBrokerSignature(base64)}
              />
            </div>
            {brokerSignature && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Podpis uložen
              </div>
            )}
            <Checkbox
              label="Souhlasím s podmínkami smlouvy"
              checked={brokerAgreed}
              onChange={(e) => setBrokerAgreed(e.target.checked)}
            />
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {step === "seller" && (
          <Button
            variant="primary"
            onClick={handleSellerConfirm}
            disabled={!isSellerValid}
            className="w-full"
          >
            Pokračovat k podpisu makléře
          </Button>
        )}

        {step === "broker" && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isBrokerValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Podepisování...
              </span>
            ) : (
              "Podepsat smlouvu"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
