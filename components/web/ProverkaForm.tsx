"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function ProverkaForm() {
  const [vin, setVin] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Prověřte si vozidlo
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Zadejte VIN a my prověříme kompletní historii vozu
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Prověrka zahájena!
          </h3>
          <p className="text-gray-600">
            Report obdržíte na email do několika minut.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="VIN kód vozidla"
            placeholder="např. TMBEA61Z002345678"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            maxLength={17}
          />

          <Button variant="primary" size="lg" className="w-full" type="submit">
            Prověřit vozidlo
          </Button>

          <p className="text-center text-sm text-gray-500">
            <span className="font-semibold text-orange-500">od 490 Kč</span>
            {" "}za kompletní report
          </p>
        </form>
      )}
    </Card>
  );
}
