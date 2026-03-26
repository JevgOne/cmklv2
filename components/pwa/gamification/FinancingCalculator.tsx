"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

const INSTALLMENT_OPTIONS = [12, 24, 36, 48, 60, 72];
const DEFAULT_RATE = 5.9; // %

export function FinancingCalculator() {
  const [price, setPrice] = useState<number>(500000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [months, setMonths] = useState<number>(60);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);

  // Email form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const result = useMemo(() => {
    const downPayment = Math.round(price * (downPaymentPct / 100));
    const loanAmount = price - downPayment;

    if (loanAmount <= 0 || months <= 0 || rate <= 0) {
      return {
        downPayment,
        loanAmount: 0,
        monthlyPayment: 0,
        totalPaid: downPayment,
        overpayment: 0,
      };
    }

    const monthlyRate = rate / 100 / 12;
    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = downPayment + monthlyPayment * months;
    const overpayment = totalPaid - price;

    return {
      downPayment,
      loanAmount,
      monthlyPayment: Math.round(monthlyPayment),
      totalPaid: Math.round(totalPaid),
      overpayment: Math.round(overpayment),
    };
  }, [price, downPaymentPct, months, rate]);

  async function handleSendEmail() {
    if (!recipientEmail || !recipientName) return;

    setSending(true);
    setEmailError(null);

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: "FINANCING",
          recipientEmail,
          recipientName,
          variables: {
            price,
            monthlyPayment: result.monthlyPayment,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba pri odesilani");
      }

      setSent(true);
      setShowEmailForm(false);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Chyba pri odesilani emailu");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Vstupy */}
      <Card className="p-4 space-y-5">
        {/* Cena vozu */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Cena vozu
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={0}
              step={10000}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              Kč
            </span>
          </div>
        </div>

        {/* Akontace */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-gray-900">Akontace</label>
            <span className="text-sm font-bold text-orange-500">
              {downPaymentPct}% ({formatPrice(Math.round(price * (downPaymentPct / 100)))})
            </span>
          </div>
          <input
            type="range"
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            min={0}
            max={50}
            step={5}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Počet splátek */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Počet splátek
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INSTALLMENT_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`py-2 rounded-xl text-sm font-bold transition-all ${
                  months === m
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m} měs.
              </button>
            ))}
          </div>
        </div>

        {/* Úroková sazba */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Úroková sazba (% p.a.)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            min={0}
            max={30}
            step={0.1}
          />
        </div>
      </Card>

      {/* Výsledky */}
      <Card className="p-4 space-y-4">
        <h3 className="font-extrabold text-gray-900">Výpočet</h3>

        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-xs text-orange-600 font-medium mb-1">
            Měsíční splátka
          </p>
          <p className="text-3xl font-extrabold text-orange-600">
            {formatPrice(result.monthlyPayment)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Akontace</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.downPayment)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Výše úvěru</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.loanAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Celkem zaplaceno</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(result.totalPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">Přeplatek</span>
            <span className="text-sm font-bold text-red-500">
              +{formatPrice(result.overpayment)}
            </span>
          </div>
        </div>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        Jedna se o orientacni kalkulaci. Skutecnou nabidku poskytne leasingova spolecnost.
      </p>

      {/* CTA */}
      {sent ? (
        <Card className="p-4 bg-green-50 border border-green-200 text-center">
          <p className="text-sm font-bold text-green-700">
            Email odeslan na {recipientEmail}
          </p>
          <button
            onClick={() => {
              setSent(false);
              setRecipientEmail("");
              setRecipientName("");
            }}
            className="text-xs text-green-600 underline mt-2"
          >
            Odeslat dalsi
          </button>
        </Card>
      ) : showEmailForm ? (
        <Card className="p-4 space-y-3">
          <h4 className="font-bold text-gray-900 text-sm">Odeslat nabidku</h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jmeno kupujiciho
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Jan Novak"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email kupujiciho
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="jan@email.cz"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {emailError && (
            <p className="text-xs text-red-500">{emailError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSendEmail}
              disabled={sending || !recipientEmail || !recipientName}
            >
              {sending ? "Odesilam..." : "Odeslat"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailForm(false);
                setEmailError(null);
              }}
              disabled={sending}
            >
              Zrusit
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setShowEmailForm(true)}
        >
          Poslat nabidku kupujicimu
        </Button>
      )}
    </div>
  );
}
