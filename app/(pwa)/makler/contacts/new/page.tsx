"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setError("Jmeno a telefon jsou povinne");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body: Record<string, string | null> = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        note: note.trim() || null,
      };

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Chyba pri ukladani");
      }

      const contact = await res.json();
      router.push(`/makler/contacts/${contact.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznama chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Novy kontakt
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pridejte noveho prodejce
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Jmeno *"
            placeholder="Jan Novak"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Telefon *"
            type="tel"
            placeholder="+420 123 456 789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="jan@email.cz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Adresa"
            placeholder="Ulice 123"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Mesto"
            placeholder="Praha"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Textarea
            label="Poznamka"
            placeholder="Volitelna poznamka k prodejci..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="min-h-[80px]"
          />

          {error && <p className="text-sm text-error-500">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Ukladam..." : "Ulozit kontakt"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Zrusit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
