"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ReservationButtonProps {
  vehicleId: string;
  vehicleName: string;
  /** Jen pro makléřská/partnerská auta */
  listingType: "BROKER" | "DEALER";
  price?: number;
}

const RESERVATION_FEE = 5000;

export function ReservationButton({
  vehicleId,
  vehicleName,
  listingType,
  price,
}: ReservationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReserve = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: RESERVATION_FEE }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe Checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se vytvořit rezervaci.");
      }
    } catch {
      setError("Chyba připojení. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => setShowModal(true)}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Rezervovat za {new Intl.NumberFormat("cs-CZ").format(RESERVATION_FEE)} Kč
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Rezervace vozidla"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Zrušit
            </Button>
            <Button variant="primary" onClick={handleReserve} disabled={loading}>
              {loading ? "Přesměrování..." : `Zaplatit ${new Intl.NumberFormat("cs-CZ").format(RESERVATION_FEE)} Kč`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 text-sm">{vehicleName}</h4>
            {price && (
              <p className="text-sm text-gray-600 mt-1">
                Cena: {new Intl.NumberFormat("cs-CZ").format(price)} Kč
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Vozidlo bude rezervováno na 48 hodin</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Rezervační poplatek se odečte z celkové ceny</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Pokud si auto nekoupíte, poplatek je nevratný</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </Modal>
    </>
  );
}
