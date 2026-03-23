"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface InviteBrokerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteBrokerModal({ open, onClose, onSuccess }: InviteBrokerModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email je povinný.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Odeslání pozvánky se nezdařilo.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      onSuccess?.();
    } catch {
      setError("Došlo k neočekávané chybě.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Pozvat makléře"
      footer={
        success ? (
          <Button variant="primary" onClick={handleClose}>Zavřít</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>Zrušit</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Odesílám..." : "Odeslat pozvánku"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <svg className="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Pozvánka odeslána!</p>
          <p className="text-xs text-gray-500 mt-1">Na adresu {email} byl odeslán pozvánkový odkaz.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="error">
              <p className="text-sm">{error}</p>
            </Alert>
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="makler@email.cz"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jméno (nepovinné)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jan"
            />
            <Input
              label="Příjmení (nepovinné)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Novák"
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
