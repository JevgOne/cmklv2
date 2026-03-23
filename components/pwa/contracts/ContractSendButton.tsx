"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface ContractSendButtonProps {
  contractId: string;
}

export function ContractSendButton({ contractId }: ContractSendButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/contracts/${contractId}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při odesílání emailu");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <Alert variant="success">
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span>Email se smlouvou byl odeslán prodejci.</span>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={handleSend}
        disabled={isSending}
        className="w-full"
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            Odesílám...
          </span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Odeslat emailem
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-error-500 text-center">{error}</p>
      )}
    </div>
  );
}
