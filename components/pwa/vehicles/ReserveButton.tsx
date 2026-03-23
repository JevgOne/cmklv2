"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";

interface ReserveButtonProps {
  vehicleId: string;
  vehicleName: string;
}

export function ReserveButton({ vehicleId, vehicleName }: ReserveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [handoverDate, setHandoverDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || undefined,
          agreedPrice: agreedPrice ? parseInt(agreedPrice) : undefined,
          handoverDate: handoverDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se rezervovat vozidlo");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se rezervovat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        Rezervovat vozidlo
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Rezervovat vozidlo"
      >
        <p className="text-sm text-gray-500 mb-4">
          {vehicleName}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Jméno kupujícího"
            placeholder="Jan Novák"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
          />

          <Input
            label="Telefon"
            type="tel"
            placeholder="+420 xxx xxx xxx"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            required
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="jan@email.cz"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
          />

          <Input
            label="Dohodnutá cena (Kč)"
            type="number"
            placeholder="350000"
            value={agreedPrice}
            onChange={(e) => setAgreedPrice(e.target.value)}
          />
          {agreedPrice && (
            <p className="text-xs text-gray-500 -mt-2">
              {formatPrice(parseInt(agreedPrice) || 0)}
            </p>
          )}

          <Input
            label="Plánované datum předání"
            type="date"
            value={handoverDate}
            onChange={(e) => setHandoverDate(e.target.value)}
          />

          <div className="flex gap-3 mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Zrušit
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Rezervuji..." : "Rezervovat"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
