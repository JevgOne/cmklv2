"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { SignatureCanvas } from "@/components/pwa/contracts/SignatureCanvas";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";

export function ContractSign() {
  const router = useRouter();
  const [contractHtml, setContractHtml] = useState("");
  const [loadingContract, setLoadingContract] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load contract template
  useEffect(() => {
    async function loadContract() {
      try {
        const res = await fetch("/api/onboarding/contract");
        if (res.ok) {
          const data = await res.json();
          setContractHtml(data.html);
        } else {
          setError("Nepodařilo se načíst smlouvu.");
        }
      } catch {
        setError("Nepodařilo se načíst smlouvu.");
      } finally {
        setLoadingContract(false);
      }
    }
    loadContract();
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!signature) {
      setError("Podepište smlouvu.");
      return;
    }
    if (!agreed) {
      setError("Musíte souhlasit s podmínkami spolupráce.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, agreed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Odeslání smlouvy se nezdařilo.");
        setLoading(false);
        return;
      }

      router.push("/makler/onboarding/approval");
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to znovu.");
      setLoading(false);
    }
  };

  if (loadingContract) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* Contract text */}
      <div className="bg-white rounded-2xl shadow-card p-6 max-h-[400px] overflow-y-auto">
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contractHtml) }}
        />
      </div>

      {/* Signature */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
          Podpis
        </label>
        {signature ? (
          <div className="rounded-lg border-2 border-success-300 bg-success-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-success-700">Podpis přiložen</span>
              </div>
              <button
                type="button"
                onClick={() => setSignature(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Znovu podepsat
              </button>
            </div>
          </div>
        ) : (
          <SignatureCanvas onConfirm={(base64) => setSignature(base64)} />
        )}
      </div>

      {/* Agreement checkbox */}
      <Checkbox
        label="Souhlasím s podmínkami spolupráce"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />

      <Button
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        disabled={loading || !signature || !agreed}
        className="w-full"
      >
        {loading ? "Odesílám..." : "Podepsat a odeslat"}
      </Button>
    </div>
  );
}
