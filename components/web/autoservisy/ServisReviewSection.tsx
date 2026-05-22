"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ReviewItem {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  recommend: boolean;
  title: string | null;
  text: string;
  ratingQuality: number | null;
  ratingPrice: number | null;
  ratingSpeed: number | null;
  ratingComm: number | null;
  serviceType: string | null;
  vehicleBrand: string | null;
  createdAt: string;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}

interface Props {
  servisId: string;
  servisName: string;
  initialReviews: ReviewItem[];
  totalReviews: number;
}

export function ServisReviewSection({ servisId, servisName, initialReviews, totalReviews }: Props) {
  const [reviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    authorName: "",
    authorCity: "",
    rating: 5,
    recommend: true,
    title: "",
    text: "",
    serviceType: "",
    vehicleBrand: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/autoservisy/${servisId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          authorCity: form.authorCity || undefined,
          title: form.title || undefined,
          serviceType: form.serviceType || undefined,
          vehicleBrand: form.vehicleBrand || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
        return;
      }
      setSuccess(true);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase">
          Recenze ({totalReviews})
        </h2>
        {!showForm && !success && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            Napsat recenzi
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
          Děkujeme za recenzi! Bude zveřejněna po schválení administrátorem.
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-orange-200 rounded-xl p-5 mb-6 bg-orange-50/30">
          <h3 className="font-bold text-gray-900 mb-4">Recenze: {servisName}</h3>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaše jméno *</label>
              <input
                type="text"
                required
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Město</label>
              <input
                type="text"
                value={form.authorCity}
                onChange={(e) => setForm({ ...form, authorCity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hodnocení *</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ služby</label>
              <input
                type="text"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                placeholder="např. výměna brzd"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text recenze * (min. 20 znaků)</label>
              <textarea
                required
                minLength={20}
                rows={4}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.recommend}
                  onChange={(e) => setForm({ ...form, recommend: e.target.checked })}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Doporučuji tento servis</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Odesílám..." : "Odeslat recenzi"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Zrušit</Button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Stars count={r.rating} />
                  <span className="font-bold text-sm text-gray-900">{r.authorName}</span>
                  {r.authorCity && <span className="text-xs text-gray-500">{r.authorCity}</span>}
                </div>
                <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="font-medium text-gray-900 text-sm">{r.title}</p>}
              <p className="text-sm text-gray-600 mt-1">{r.text}</p>
              <div className="flex items-center gap-3 mt-2">
                {r.serviceType && (
                  <span className="text-xs text-gray-500">Služba: {r.serviceType}</span>
                )}
                {r.recommend && (
                  <span className="text-xs text-green-600">Doporučuje</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">
          Zatím žádné recenze. Buďte první!
        </p>
      )}
    </Card>
  );
}
