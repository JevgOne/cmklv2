"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AddPartWizard } from "@/components/pwa-parts/parts/AddPartWizard";
import { PhotoStep } from "@/components/pwa-parts/parts/PhotoStep";
import { DetailsStep, type PartDetails } from "@/components/pwa-parts/parts/DetailsStep";
import { PricingStep, type PricingData } from "@/components/pwa-parts/parts/PricingStep";
import { Button } from "@/components/ui/Button";

type Step = 1 | 2 | 3;

interface PartImage {
  url: string;
  order: number;
  isPrimary: boolean;
}

export default function EditPartPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [details, setDetails] = useState<PartDetails>({
    name: "",
    category: "",
    condition: "",
    conditionNote: "",
    description: "",
    oemNumber: "",
    manufacturer: "",
    sourceVin: "",
    compatibility: [{ brand: "", model: "", yearFrom: "", yearTo: "" }],
  });
  const [pricing, setPricing] = useState<PricingData>({
    price: "",
    vatIncluded: true,
    quantity: "1",
    warranty: "",
    deliveryOptions: ["PICKUP"],
  });

  const fetchPart = useCallback(async () => {
    try {
      const res = await fetch(`/api/parts/${id}`);
      if (!res.ok) {
        setError("Dil nenalezen");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const p = data.part;

      // Populate photos
      const imageUrls = (p.images ?? [])
        .sort((a: PartImage, b: PartImage) => a.order - b.order)
        .map((img: PartImage) => img.url);
      setPhotos(imageUrls);

      // Populate details — reconstruct compatibility from flat API fields
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

      setDetails({
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

      // Populate pricing
      setPricing({
        price: p.price ? String(p.price) : "",
        vatIncluded: p.vatIncluded ?? true,
        quantity: p.stock ? String(p.stock) : "1",
        warranty: p.warranty ?? "",
        deliveryOptions: ["PICKUP"],
      });
    } catch {
      setError("Chyba pri nacitani dilu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPart();
  }, [fetchPart]);

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

      const res = await fetch(`/api/parts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/parts/${id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ulozeni se nezdarilo");
      }
    } catch {
      setError("Chyba pri ukladani");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="h-7 bg-gray-100 rounded animate-pulse max-w-lg mx-auto" />
        </div>
        <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
          <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !details.name) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-900">{error}</h2>
        <Link href="/parts/my" className="no-underline">
          <Button variant="primary" size="sm" className="mt-4">
            Zpet na moje dily
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Cancel link */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Upravit dil</span>
          <Link href={`/parts/${id}`} className="text-sm text-gray-500 no-underline">
            Zrusit
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
