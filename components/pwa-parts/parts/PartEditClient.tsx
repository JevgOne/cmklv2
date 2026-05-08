"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddPartWizard } from "@/components/pwa-parts/parts/AddPartWizard";
import { PhotoStep } from "@/components/pwa-parts/parts/PhotoStep";
import { DetailsStep, type PartDetails } from "@/components/pwa-parts/parts/DetailsStep";
import { PricingStep, type PricingData } from "@/components/pwa-parts/parts/PricingStep";
import { Button } from "@/components/ui/Button";

type Step = 1 | 2 | 3;

interface PartEditClientProps {
  initialPart: {
    id: string;
    name: string;
    category: string;
    condition: string;
    description: string | null;
    oemNumber: string | null;
    manufacturer: string | null;
    warranty: string | null;
    price: number;
    vatIncluded: boolean;
    stock: number;
    compatibleBrands: string | null;
    compatibleModels: string | null;
    compatibleYearFrom: number | null;
    compatibleYearTo: number | null;
    images: Array<{ url: string; order: number; isPrimary: boolean }>;
  };
}

export function PartEditClient({ initialPart }: PartEditClientProps) {
  const router = useRouter();
  const p = initialPart;

  // Transform initial data into form state
  const imageUrls = [...p.images]
    .sort((a, b) => a.order - b.order)
    .map((img) => img.url);

  const brands: string[] = p.compatibleBrands ? JSON.parse(p.compatibleBrands) : [];
  const models: string[] = p.compatibleModels ? JSON.parse(p.compatibleModels) : [];
  const yearFrom = p.compatibleYearFrom ? String(p.compatibleYearFrom) : "";
  const yearTo = p.compatibleYearTo ? String(p.compatibleYearTo) : "";

  const compatibility = brands.length > 0
    ? brands.map((brand, i) => ({
        brand,
        model: models[i] ?? "",
        yearFrom,
        yearTo,
      }))
    : [{ brand: "", model: "", yearFrom: "", yearTo: "" }];

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>(imageUrls);
  const [details, setDetails] = useState<PartDetails>({
    name: p.name ?? "",
    category: p.category ?? "",
    condition: p.condition ?? "",
    conditionNote: "",
    description: p.description ?? "",
    oemNumber: p.oemNumber ?? "",
    manufacturer: p.manufacturer ?? "",
    sourceVin: "",
    compatibility,
  });
  const [pricing, setPricing] = useState<PricingData>({
    price: p.price ? String(p.price) : "",
    vatIncluded: p.vatIncluded ?? true,
    quantity: p.stock ? String(p.stock) : "1",
    warranty: p.warranty ?? "",
    deliveryOptions: ["PICKUP"],
  });

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const validCompat = details.compatibility.filter((c) => c.brand);
      const body = {
        name: details.name,
        category: details.category,
        condition: details.condition,
        description: details.description || undefined,
        oemNumber: details.oemNumber || undefined,
        manufacturer: details.manufacturer || undefined,
        warranty: pricing.warranty || undefined,
        price: parseInt(pricing.price),
        vatIncluded: pricing.vatIncluded,
        stock: parseInt(pricing.quantity) || 1,
        compatibleBrands: validCompat.map((c) => c.brand),
        compatibleModels: validCompat.map((c) => c.model).filter(Boolean),
        compatibleYearFrom: validCompat[0]?.yearFrom
          ? parseInt(validCompat[0].yearFrom)
          : undefined,
        compatibleYearTo: validCompat[0]?.yearTo
          ? parseInt(validCompat[0].yearTo)
          : undefined,
        images: photos.map((url, i) => ({
          url,
          order: i,
          isPrimary: i === 0,
        })),
      };

      const res = await fetch(`/api/parts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/parts/${p.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Uložení se nezdařilo");
      }
    } catch {
      setError("Chyba při ukládání");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Cancel link */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Upravit díl</span>
          <Link href={`/parts/${p.id}`} className="text-sm text-gray-500 no-underline">
            Zrušit
          </Link>
        </div>
      </div>

      {error && (
        <div className="max-w-lg mx-auto px-4 pt-3">
          <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
        </div>
      )}

      <AddPartWizard currentStep={step}>
        {step === 1 && (
          <PhotoStep
            photos={photos}
            onPhotosChange={setPhotos}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DetailsStep
            details={details}
            onDetailsChange={setDetails}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <PricingStep
            pricing={pricing}
            onPricingChange={setPricing}
            details={details}
            photos={photos}
            onBack={() => setStep(2)}
            onPublish={handleSave}
            submitting={submitting}
          />
        )}
      </AddPartWizard>
    </div>
  );
}
