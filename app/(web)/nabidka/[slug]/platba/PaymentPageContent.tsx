"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BankTransferDetails } from "./BankTransferDetails";

interface VehicleInfo {
  id: string;
  name: string;
  year: number;
  amount: number;
  slug: string;
  city: string;
  imageUrl: string | null;
  brokerName: string | null;
}

type PaymentMethod = "CARD" | "BANK_TRANSFER";

export function PaymentPageContent({ vehicle }: { vehicle: VehicleInfo }) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<{
    accountNumber: string;
    iban: string;
    bic: string;
    bankName: string;
    accountHolder: string;
    amount: number;
    variableSymbol: string;
    message: string;
  } | null>(null);

  const formattedAmount = new Intl.NumberFormat("cs-CZ").format(vehicle.amount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!method) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          method,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nastala chyba");
        return;
      }

      if (method === "CARD" && data.url) {
        window.location.href = data.url;
        return;
      }

      if (method === "BANK_TRANSFER" && data.bankDetails) {
        setBankDetails(data.bankDetails);
      }
    } catch {
      setError("Nastala neočekávaná chyba");
    } finally {
      setLoading(false);
    }
  }

  if (bankDetails) {
    return (
      <BankTransferDetails
        bankDetails={bankDetails}
        vehicleName={vehicle.name}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Shrnutí vozidla */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          {vehicle.imageUrl && (
            <img
              src={vehicle.imageUrl}
              alt={vehicle.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {vehicle.name} ({vehicle.year})
            </h2>
            <p className="text-sm text-gray-500">{vehicle.city}</p>
            {vehicle.brokerName && (
              <p className="text-sm text-gray-500">
                Makléř: {vehicle.brokerName}
              </p>
            )}
            <p className="text-xl font-bold text-orange-500 mt-1">
              {formattedAmount} Kč
            </p>
          </div>
        </div>
      </Card>

      {/* Údaje kupujícího */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Údaje kupujícího
        </h3>
        <div className="space-y-4">
          <Input
            label="Jméno a příjmení"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            placeholder="Jan Novák"
          />
          <Input
            label="Email"
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            required
            placeholder="jan@email.cz"
          />
          <Input
            label="Telefon"
            type="tel"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            placeholder="+420 xxx xxx xxx"
          />
        </div>
      </Card>

      {/* Výběr platební metody */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Způsob platby
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMethod("CARD")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              method === "CARD"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="font-semibold text-gray-900">Platba kartou</div>
            <div className="text-sm text-gray-500">
              Okamžité zpracování přes Stripe
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod("BANK_TRANSFER")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              method === "BANK_TRANSFER"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-2">🏦</div>
            <div className="font-semibold text-gray-900">
              Bankovní převod
            </div>
            <div className="text-sm text-gray-500">
              Platba na účet s variabilním symbolem
            </div>
          </button>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!method || !buyerName || !buyerEmail || loading}
      >
        {loading
          ? "Zpracovávám..."
          : method === "CARD"
            ? `Zaplatit ${formattedAmount} Kč kartou`
            : method === "BANK_TRANSFER"
              ? "Zobrazit platební údaje"
              : `Zaplatit ${formattedAmount} Kč`}
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        Platba je zpracována bezpečně přes CarMakléř. Po přijetí platby vás bude
        kontaktovat makléř ohledně předání vozidla.
      </p>
    </form>
  );
}
