"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ContractPdfButtonProps {
  contractId: string;
  hasPdf: boolean;
  pdfUrl: string | null;
}

export function ContractPdfButton({
  contractId,
  hasPdf,
  pdfUrl,
}: ContractPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(pdfUrl);
  const [error, setError] = useState<string | null>(null);

  const pdfReady = hasPdf || !!generatedUrl;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/pdf`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba pri generovani PDF");
      }

      const data = await res.json();
      setGeneratedUrl(data.pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neocekavana chyba");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const url = generatedUrl;
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `smlouva-${contractId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-2">
      {!pdfReady ? (
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generuji PDF...
            </span>
          ) : (
            "Vygenerovat PDF"
          )}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={handleDownload}
          className="w-full"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Stahnout PDF
        </Button>
      )}
      {error && (
        <p className="text-xs text-error-500 text-center">{error}</p>
      )}
    </div>
  );
}
