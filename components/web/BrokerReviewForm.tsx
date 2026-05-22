"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  brokerSlug: string;
  brokerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function StarInput({
  value,
  onChange,
  size = "text-2xl",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`cursor-pointer bg-transparent border-none p-0 ${size} transition-transform hover:scale-110 ${
            n <= (hover || value) ? "text-orange-400" : "text-gray-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const TRANSACTION_OPTIONS = [
  { value: "SALE", label: "Prodej auta" },
  { value: "PURCHASE", label: "Nákup auta" },
  { value: "CONSULTATION", label: "Konzultace" },
];

export function BrokerReviewForm({ brokerSlug, brokerName, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    authorName: "",
    authorCity: "",
    rating: 0,
    text: "",
    recommend: true,
    transactionType: "",
    vehicleBrand: "",
    ratingCommunication: 0,
    ratingSpeed: 0,
    ratingFairness: 0,
    ratingProfessionalism: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDetailed, setShowDetailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) {
      setError("Zadejte celkové hodnocení");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/brokers/${brokerSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: form.authorName,
          authorCity: form.authorCity || undefined,
          rating: form.rating,
          text: form.text,
          recommend: form.recommend,
          transactionType: form.transactionType || undefined,
          vehicleBrand: form.vehicleBrand || undefined,
          ratingCommunication: form.ratingCommunication || undefined,
          ratingSpeed: form.ratingSpeed || undefined,
          ratingFairness: form.ratingFairness || undefined,
          ratingProfessionalism: form.ratingProfessionalism || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
        return;
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-orange-200 rounded-xl p-5 bg-orange-50/30">
      <h3 className="font-bold text-gray-900 mb-4">
        Ohodnoťte makléře {brokerName}
      </h3>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Overall rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Celkové hodnocení *
        </label>
        <StarInput value={form.rating} onChange={(v) => {
          setForm({ ...form, rating: v });
          if (!showDetailed) setShowDetailed(true);
        }} />
      </div>

      {/* Detailed ratings — progressive disclosure */}
      {showDetailed && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-3">
            Detailní hodnocení (nepovinné)
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              ["ratingCommunication", "Komunikace"],
              ["ratingSpeed", "Rychlost jednání"],
              ["ratingFairness", "Férovost"],
              ["ratingProfessionalism", "Profesionalita"],
            ] as const).map(([field, label]) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <StarInput
                  value={form[field]}
                  onChange={(v) => setForm({ ...form, [field]: v })}
                  size="text-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Typ transakce
        </label>
        <div className="flex flex-wrap gap-2">
          {TRANSACTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  transactionType: form.transactionType === opt.value ? "" : opt.value,
                })
              }
              className={`px-3 py-1.5 text-sm rounded-full border transition cursor-pointer ${
                form.transactionType === opt.value
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Author info + vehicle */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vaše jméno *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Město
          </label>
          <input
            type="text"
            value={form.authorCity}
            onChange={(e) => setForm({ ...form, authorCity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Značka vozidla
          </label>
          <input
            type="text"
            value={form.vehicleBrand}
            onChange={(e) => setForm({ ...form, vehicleBrand: e.target.value })}
            placeholder="např. Škoda Octavia"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Review text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vaše zkušenost * (min. 20 znaků)
        </label>
        <textarea
          required
          minLength={20}
          maxLength={5000}
          rows={4}
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {form.text.length} / 5000
        </p>
      </div>

      {/* Recommend */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.recommend}
            onChange={(e) => setForm({ ...form, recommend: e.target.checked })}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">
            Doporučuji tohoto makléře
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Odesílám..." : "Odeslat recenzi"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušit
        </Button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Recenze bude zveřejněna po ověření administrátorem.
      </p>
    </form>
  );
}
