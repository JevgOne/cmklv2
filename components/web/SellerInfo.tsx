"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { ListingBadge } from "./ListingBadge";

interface SellerInfoProps {
  /** Typ inzerátu: BROKER, DEALER, PRIVATE */
  listingType: "BROKER" | "DEALER" | "PRIVATE";
  /** Jméno prodejce / firmy */
  sellerName: string;
  /** Telefon (pro DEALER/BROKER — přímý kontakt) */
  phone?: string;
  /** Email */
  email?: string;
  /** Adresa (pro DEALER) */
  address?: string;
  /** ID inzerátu (pro kontaktní formulář) */
  listingId: string;
  /** Název vozu (pro kontextový předmět formuláře) */
  vehicleName: string;
}

export function SellerInfo({
  listingType,
  sellerName,
  phone,
  email,
  address,
  listingId,
  vehicleName,
}: SellerInfoProps) {
  const isPrivate = listingType === "PRIVATE";
  const isDealerOrPartner = listingType === "DEALER" || listingType === "BROKER";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
          {sellerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-gray-900">{sellerName}</div>
          <ListingBadge
            type={listingType === "BROKER" ? "broker" : listingType === "DEALER" ? "partner" : "private"}
          />
        </div>
      </div>

      {isDealerOrPartner && (
        <div className="space-y-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="no-underline block"
            >
              <Button variant="primary" size="lg" className="w-full">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Zavolat {phone}
              </Button>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="no-underline block">
              <Button variant="outline" size="default" className="w-full">
                Napsat e-mail
              </Button>
            </a>
          )}
          {address && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">📍 Adresa</div>
              {address}
            </div>
          )}
        </div>
      )}

      {isPrivate && (
        <PrivateContactForm listingId={listingId} vehicleName={vehicleName} />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Kontaktní formulář pro soukromé inzeráty                          */
/* ------------------------------------------------------------------ */

function PrivateContactForm({
  listingId,
  vehicleName,
}: {
  listingId: string;
  vehicleName: string;
}) {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState(
    `Dobrý den, mám zájem o ${vehicleName}. Prosím o kontakt.`
  );
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim() || !message.trim()) {
      setError("Vyplňte prosím jméno, email a zprávu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listingId}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se odeslat zprávu.");
      }
    } catch {
      setError("Chyba připojení. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✓</div>
        <h4 className="font-bold text-gray-900">Zpráva odeslána</h4>
        <p className="text-sm text-gray-500 mt-1">
          Prodejce vás bude kontaktovat.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-orange-50 rounded-xl p-4 mb-4">
        <p className="text-sm text-orange-800 font-medium">
          Kontaktovat přes CarMakléř
        </p>
        <p className="text-xs text-orange-600 mt-1">
          Vaše kontaktní údaje budou předány prodejci.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Jméno"
          placeholder="Jan Novák"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="vas@email.cz"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
        <Input
          label="Telefon (volitelné)"
          type="tel"
          placeholder="+420 123 456 789"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
        <Textarea
          label="Zpráva"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[80px]"
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Odesílám..." : "Odeslat zprávu"}
        </Button>
      </form>
    </div>
  );
}
