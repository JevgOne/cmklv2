"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatPrice, formatMileage } from "@/lib/utils";

interface VehicleDetail {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  power: number | null;
  vin: string | null;
  city: string | null;
  description: string | null;
  status: string;
  viewCount: number;
  images: Array<{ id: string; url: string; order: number; isPrimary: boolean }>;
  _count?: { inquiries: number };
}

const statusVariants: Record<string, "verified" | "pending" | "top" | "default"> = {
  ACTIVE: "verified",
  PENDING: "pending",
  SOLD: "top",
  DRAFT: "default",
  RESERVED: "pending",
  ARCHIVED: "default",
};

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín", DIESEL: "Diesel", ELECTRIC: "Elektro",
  HYBRID: "Hybrid", LPG: "LPG", CNG: "CNG",
};

const transLabels: Record<string, string> = {
  MANUAL: "Manuální", AUTOMATIC: "Automat",
};

export default function PartnerVehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  // Edit form state
  const [editPrice, setEditPrice] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCity, setEditCity] = useState("");

  const fetchVehicle = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVehicle(data.vehicle ?? data);
      }
    } catch {
      // empty state handles
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const startEdit = () => {
    if (!vehicle) return;
    setEditPrice(String(vehicle.price));
    setEditMileage(String(vehicle.mileage));
    setEditDescription(vehicle.description || "");
    setEditCity(vehicle.city || "");
    setEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!vehicle) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseInt(editPrice) || vehicle.price,
          mileage: parseInt(editMileage) || vehicle.mileage,
          description: editDescription || undefined,
          city: editCity || undefined,
        }),
      });
      if (res.ok) {
        setEditing(false);
        await fetchVehicle();
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

  const handleArchive = async () => {
    if (!vehicle) return;
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (res.ok) {
        router.push("/partner/vehicles");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nelze archivovat");
      }
    } catch {
      setError("Chyba připojení");
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-900">Vozidlo nenalezeno</h2>
        <Link href="/partner/vehicles" className="no-underline">
          <Button variant="primary" size="sm" className="mt-4">Zpět na vozidla</Button>
        </Link>
      </div>
    );
  }

  const images = vehicle.images.sort((a, b) => a.order - b.order);
  const canArchive = ["ACTIVE", "RESERVED"].includes(vehicle.status);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Image */}
      <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-5">
        {images.length > 0 ? (
          <>
            <Image
              src={images[imageIndex]?.url}
              alt={`${vehicle.brand} ${vehicle.model}`}
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
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🚗</div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
      )}

      {editing ? (
        /* Edit mode */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Upravit: {vehicle.brand} {vehicle.model} ({vehicle.year})
          </h2>
          <Input
            label="Cena (Kč)"
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />
          <Input
            label="Nájezd (km)"
            type="number"
            value={editMileage}
            onChange={(e) => setEditMileage(e.target.value)}
          />
          <Input
            label="Město"
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
          />
          <Textarea
            label="Popis"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
              Zrušit
            </Button>
            <Button variant="primary" size="lg" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </h1>
              <div className="text-2xl font-extrabold text-orange-500 mt-1">
                {formatPrice(vehicle.price)}
              </div>
            </div>
            <Badge variant={statusVariants[vehicle.status] || "default"}>
              {vehicle.status}
            </Badge>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="text-sm">
              <span className="text-gray-500">Nájezd</span>
              <div className="font-semibold text-gray-900">{formatMileage(vehicle.mileage)}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Palivo</span>
              <div className="font-semibold text-gray-900">{fuelLabels[vehicle.fuel] || vehicle.fuel}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Převodovka</span>
              <div className="font-semibold text-gray-900">{transLabels[vehicle.transmission] || vehicle.transmission}</div>
            </div>
            {vehicle.power && (
              <div className="text-sm">
                <span className="text-gray-500">Výkon</span>
                <div className="font-semibold text-gray-900">{vehicle.power} kW</div>
              </div>
            )}
            {vehicle.vin && (
              <div className="text-sm">
                <span className="text-gray-500">VIN</span>
                <div className="font-semibold text-gray-900 font-mono text-xs">{vehicle.vin}</div>
              </div>
            )}
            {vehicle.city && (
              <div className="text-sm">
                <span className="text-gray-500">Město</span>
                <div className="font-semibold text-gray-900">{vehicle.city}</div>
              </div>
            )}
          </div>

          {/* Description */}
          {vehicle.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Popis</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>👁 {vehicle.viewCount} zobrazení</span>
            {vehicle._count && <span>💬 {vehicle._count.inquiries} zájemců</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/partner/vehicles" className="flex-1 no-underline">
              <Button variant="outline" size="lg" className="w-full">Zpět</Button>
            </Link>
            <Button variant="primary" size="lg" className="flex-1" onClick={startEdit}>
              Upravit
            </Button>
          </div>
          {canArchive && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-red-500 border-red-200 hover:bg-red-50"
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? "Archivuji..." : "Stáhnout z nabídky"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
