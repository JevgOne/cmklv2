"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";

interface DealerFlipDetailProps {
  flipDetail: {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    vin: string | null;
    status: FlipStep;
    purchasePrice: number;
    repairCost: number;
    estimatedSalePrice: number;
    fundedAmount: number;
    neededAmount: number;
    repairDescription: string | null;
    investors: Array<{ name: string; amount: number }>;
    photos: string[];
    repairPhotos: string[];
    createdAt: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Schváleno",
  FUNDING: "Financování",
  FUNDED: "Financováno",
  IN_REPAIR: "V opravě",
  FOR_SALE: "K prodeji",
  SOLD: "Prodáno",
  COMPLETED: "Vyplaceno",
};

export function DealerFlipDetail({ flipDetail }: DealerFlipDetailProps) {
  const [repairPhotos, setRepairPhotos] = useState<string[]>(flipDetail.repairPhotos);
  const [status, setStatus] = useState<FlipStep>(flipDetail.status);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "marketplace");
        formData.append("subfolder", flipDetail.id);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Chyba při nahrávání");
        }
        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      const allPhotos = [...repairPhotos, ...uploadedUrls];

      // Save to DB via PUT API
      const putRes = await fetch(`/api/marketplace/opportunities/${flipDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repairPhotos: allPhotos }),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.error || "Chyba při ukládání");
      }

      setRepairPhotos(allPhotos);
      setSuccess(`Nahráno ${uploadedUrls.length} ${uploadedUrls.length === 1 ? "fotka" : "fotek"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při nahrávání");
    } finally {
      setUploading(false);
    }
  }, [flipDetail.id, repairPhotos]);

  const handleMarkComplete = useCallback(async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/marketplace/opportunities/${flipDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FOR_SALE" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chyba při aktualizaci stavu");
      }

      setStatus("FOR_SALE");
      setSuccess("Oprava označena jako dokončená");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při aktualizaci");
    } finally {
      setUpdating(false);
    }
  }, [flipDetail.id]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePhotoUpload(e.target.files);
      e.target.value = "";
    }
  }, [handlePhotoUpload]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/dealer" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Realizátor
        </Link>
        <span>/</span>
        <span className="text-gray-900">{flipDetail.brand} {flipDetail.model}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {flipDetail.brand} {flipDetail.model}
          </h1>
          <p className="text-gray-500 mt-1">
            {flipDetail.year} · {flipDetail.mileage.toLocaleString("cs-CZ")} km · VIN: {flipDetail.vin}
          </p>
        </div>
        <Badge variant="top">{STATUS_LABELS[status] || status}</Badge>
      </div>

      {/* Timeline */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Průběh flipu</h2>
        <FlipTimeline currentStep={status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          <Card className="overflow-hidden">
            {flipDetail.photos[0] && (
              <div className="relative aspect-video">
                <Image
                  src={flipDetail.photos[0]}
                  alt={`${flipDetail.brand} ${flipDetail.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            )}
          </Card>

          {/* Repair info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plán opravy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.repairDescription}</p>

            {/* Repair photos upload area */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Fotky z opravy</h3>
              {repairPhotos.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm text-gray-500">Nahrajte fotky průběhu opravy</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Nahrávám..." : "Nahrát fotky"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {repairPhotos.map((url, i) => (
                      <div key={i} className="relative aspect-square">
                        <Image src={url} alt={`Oprava ${i + 1}`} fill className="rounded-lg object-cover" sizes="33vw" />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Nahrávám..." : "Přidat další fotky"}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Investors */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Investoři ({flipDetail.investors.length})
            </h2>
            <div className="space-y-3">
              {flipDetail.investors.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{inv.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(inv.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfitCalculator
            initialPurchasePrice={flipDetail.purchasePrice}
            initialRepairCost={flipDetail.repairCost}
            initialSalePrice={flipDetail.estimatedSalePrice}
            readOnly
          />

          {/* Status update */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Aktualizovat stav</h3>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-3">
                {success}
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleMarkComplete}
                disabled={status !== "IN_REPAIR" || updating}
              >
                {updating ? "Ukládám..." : "Označit jako dokončené"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Nahrávám..." : "Aktualizovat fotky"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
