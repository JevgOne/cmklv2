"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PartRequestFormProps {
  onSuccess?: () => void;
  prefillQuery?: string;
}

export function PartRequestForm({ onSuccess, prefillQuery }: PartRequestFormProps) {
  const { data: session } = useSession();
  const [description, setDescription] = useState(prefillQuery ?? "");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vin, setVin] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(session?.user?.email ?? "");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerName, setBuyerName] = useState(
    session?.user?.name ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/part-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          vehicleBrand: vehicleBrand || undefined,
          vehicleModel: vehicleModel || undefined,
          vehicleYear: vehicleYear ? parseInt(vehicleYear, 10) : undefined,
          vin: vin || undefined,
          buyerEmail,
          buyerPhone: buyerPhone || undefined,
          buyerName: buyerName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat poptávku");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při odesílání");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">&#9989;</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Poptávka odeslána!
        </h3>
        <p className="text-gray-500 text-sm">
          Vrakoviště obdrží vaši poptávku a ozvou se vám s nabídkami.
          Platnost poptávky je 14 dní.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Co hledáte? *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Např. přední nárazník, levé přední světlo, motor 1.9 TDI..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[80px] resize-y"
          required
          minLength={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Značka vozu"
          placeholder="Škoda"
          value={vehicleBrand}
          onChange={(e) => setVehicleBrand(e.target.value)}
        />
        <Input
          label="Model"
          placeholder="Octavia"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
        />
        <Input
          label="Rok výroby"
          placeholder="2018"
          type="number"
          value={vehicleYear}
          onChange={(e) => setVehicleYear(e.target.value)}
        />
      </div>

      <Input
        label="VIN (nepovinné)"
        placeholder="TMBZZZ5JXJZ123456"
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        maxLength={17}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Vaše jméno"
          placeholder="Jan Novák"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
        />
        <Input
          label="E-mail *"
          placeholder="jan@email.cz"
          type="email"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          required
        />
        <Input
          label="Telefon"
          placeholder="+420 ..."
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Odesílám..." : "Odeslat poptávku"}
      </Button>
    </form>
  );
}
