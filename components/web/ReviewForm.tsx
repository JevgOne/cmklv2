"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const typeOptions = [
  { value: "GENERAL", label: "Obecná zkušenost" },
  { value: "SALE", label: "Prodej auta" },
  { value: "PURCHASE", label: "Nákup auta" },
  { value: "PARTS", label: "Nákup dílů" },
  { value: "MARKETPLACE", label: "Marketplace" },
];

export function ReviewForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [type, setType] = useState("GENERAL");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name, authorCity: city || undefined, text, rating, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat recenzi");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat recenzi");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Recenze odeslána!
        </h3>
        <p className="text-gray-500">
          Děkujeme za vaši recenzi. Po schválení se zobrazí na stránce.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-8 max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Napište nám recenzi</h3>
      <p className="text-sm text-gray-500 mb-5">Vaše zpětná vazba nám pomáhá se zlepšovat</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hodnocení</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl cursor-pointer bg-transparent border-none p-0 transition-transform hover:scale-110"
              >
                {star <= (hoverRating || rating) ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Jméno"
          placeholder="Jan N."
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Město (nepovinné)"
          placeholder="Praha"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Select
          label="Typ zkušenosti"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Textarea
          label="Vaše recenze"
          placeholder="Popište svoji zkušenost s CarMakléřem..."
          rows={4}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button variant="primary" size="lg" type="submit" className="mt-2" disabled={submitting}>
          {submitting ? "Odesílám..." : "Odeslat recenzi"}
        </Button>
      </form>
    </Card>
  );
}
