"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DeletePartDialog } from "@/components/pwa-parts/parts/DeletePartDialog";
import { PhotoUpload } from "@/components/partner/PhotoUpload";
import { formatPrice } from "@/lib/utils";

interface PartDetail {
  id: string;
  name: string;
  category: string;
  condition: string;
  price: number;
  vatIncluded: boolean;
  stock: number;
  status: string;
  description: string | null;
  oemNumber: string | null;
  manufacturer: string | null;
  warranty: string | null;
  compatibleBrands: string | null;
  compatibleModels: string | null;
  images: Array<{ id: string; url: string; order: number }>;
}

const statusVariants: Record<string, "verified" | "pending" | "top" | "default"> = {
  ACTIVE: "verified",
  RESERVED: "pending",
  SOLD: "top",
  INACTIVE: "default",
};

const categoryLabels: Record<string, string> = {
  ENGINE: "Motor", TRANSMISSION: "Převodovka", BODY: "Karosérie",
  INTERIOR: "Interiér", ELECTRICAL: "Elektro", SUSPENSION: "Podvozek",
  BRAKES: "Brzdy", EXHAUST: "Výfuk", COOLING: "Klimatizace",
  WHEELS: "Kola", FUEL: "Palivo", OTHER: "Ostatní",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nový", USED_GOOD: "Plně funkční", USED_FAIR: "Funkční s vadou",
  USED_POOR: "Na díly", REFURBISHED: "Repasovaný",
};

export default function PartnerPartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [part, setPart] = useState<PartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotos, setEditPhotos] = useState<string[]>([]);

  const fetchPart = useCallback(async () => {
    try {
      const res = await fetch(`/api/parts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPart(data.part);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPart();
  }, [fetchPart]);

  const startEdit = () => {
    if (!part) return;
    setEditName(part.name);
    setEditPrice(String(part.price));
    setEditStock(String(part.stock));
    setEditDescription(part.description || "");
    setEditPhotos(part.images.sort((a, b) => a.order - b.order).map((img) => img.url));
    setEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!part) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          category: part.category,
          condition: part.condition,
          price: parseInt(editPrice) || part.price,
          vatIncluded: part.vatIncluded,
          stock: parseInt(editStock) || part.stock,
          description: editDescription || undefined,
          images: editPhotos.map((url, i) => ({ url, order: i, isPrimary: i === 0 })),
        }),
      });
      if (res.ok) {
        setEditing(false);
        await fetchPart();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Uložení se nezdařilo");
      }
    } catch {
      setError("Chyba připojení");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-900">Díl nenalezen</h2>
        <Link href="/partner/parts" className="no-underline">
          <Button variant="primary" size="sm" className="mt-4">Zpět na díly</Button>
        </Link>
      </div>
    );
  }

  const images = part.images.sort((a, b) => a.order - b.order);
  const brands: string[] = part.compatibleBrands ? JSON.parse(part.compatibleBrands) : [];
  const models: string[] = part.compatibleModels ? JSON.parse(part.compatibleModels) : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Image */}
      <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-5">
        {images.length > 0 ? (
          <>
            <Image
              src={images[imageIndex]?.url}
              alt={part.name}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-2 h-2 rounded-full border-none cursor-pointer ${i === imageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🔧</div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
      )}

      {editing ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Upravit díl</h2>
          <PhotoUpload photos={editPhotos} onChange={setEditPhotos} max={10} />
          <Input label="Název" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Cena (Kč)" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
          <Input label="Skladem (ks)" type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} />
          <Textarea label="Popis" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-[80px]" />
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>Zrušit</Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">{part.name}</h1>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-orange-500">{formatPrice(part.price)}</span>
                <span className="text-sm text-gray-500">{part.vatIncluded ? "s DPH" : "bez DPH"}</span>
              </div>
            </div>
            <Badge variant={statusVariants[part.status] || "default"}>{part.status}</Badge>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">{categoryLabels[part.category] || part.category}</Badge>
            <Badge variant="default">{conditionLabels[part.condition] || part.condition}</Badge>
          </div>

          {/* Details */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Skladem</span>
              <span className="font-semibold text-gray-900">{part.stock} ks</span>
            </div>
            {part.manufacturer && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Výrobce</span>
                <span className="font-semibold text-gray-900">{part.manufacturer}</span>
              </div>
            )}
            {part.oemNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">OEM číslo</span>
                <span className="font-semibold text-gray-900">{part.oemNumber}</span>
              </div>
            )}
            {part.warranty && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Záruka</span>
                <span className="font-semibold text-gray-900">{part.warranty}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {part.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Popis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{part.description}</p>
            </div>
          )}

          {/* Compatibility */}
          {brands.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Kompatibilita</h3>
              <div className="space-y-1">
                {brands.map((brand, i) => (
                  <div key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{brand}</span>
                    {models[i] && <span className="text-gray-500 ml-1">{models[i]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/partner/parts" className="flex-1 no-underline">
              <Button variant="outline" size="lg" className="w-full">Zpět</Button>
            </Link>
            <Button variant="primary" size="lg" className="flex-1" onClick={startEdit}>Upravit</Button>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            Smazat díl
          </Button>
        </div>
      )}

      <DeletePartDialog
        partId={part.id}
        partName={part.name}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/partner/parts")}
      />
    </div>
  );
}
