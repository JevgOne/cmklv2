"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

interface ListingFlagButtonProps {
  listingId: string;
  /** "vehicle" nebo "listing" zdroj */
  source?: "vehicle" | "listing";
}

const flagReasons = [
  { value: "FAKE", label: "Podvodný inzerát" },
  { value: "WRONG_INFO", label: "Chybné informace" },
  { value: "DUPLICATE", label: "Duplicitní inzerát" },
  { value: "SOLD", label: "Již prodáno" },
  { value: "OFFENSIVE", label: "Nevhodný obsah" },
  { value: "OTHER", label: "Jiný důvod" },
];

export function ListingFlagButton({ listingId, source = "listing" }: ListingFlagButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) {
      setError("Vyberte prosím důvod nahlášení.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = source === "vehicle"
        ? `/api/vehicles/${listingId}/flag`
        : `/api/listings/${listingId}/flag`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se nahlásit inzerát.");
      }
    } catch {
      setError("Chyba připojení.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    if (sent) {
      setReason("");
      setDetails("");
      setSent(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
        Nahlásit inzerát
      </button>

      <Modal
        open={showModal}
        onClose={handleClose}
        title={sent ? "Děkujeme" : "Nahlásit inzerát"}
        footer={
          sent ? (
            <Button variant="primary" onClick={handleClose}>
              Zavřít
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Zrušit
              </Button>
              <Button variant="danger" onClick={handleSubmit} disabled={loading}>
                {loading ? "Odesílám..." : "Nahlásit"}
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-gray-600">
              Vaše nahlášení bylo přijato a bude posouzeno naším týmem.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Důvod nahlášení
              </label>
              <div className="space-y-2">
                {flagReasons.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="flag-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label="Podrobnosti (volitelné)"
              placeholder="Popište problém podrobněji..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[80px]"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
