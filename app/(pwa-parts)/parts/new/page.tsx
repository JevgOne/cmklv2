"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddPartWizard } from "@/components/pwa-parts/parts/AddPartWizard";
import { PhotoStep } from "@/components/pwa-parts/parts/PhotoStep";
import { DetailsStep, type PartDetails } from "@/components/pwa-parts/parts/DetailsStep";
import { PricingStep, type PricingData } from "@/components/pwa-parts/parts/PricingStep";

type Step = 1 | 2 | 3;

export default function NewPartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [details, setDetails] = useState<PartDetails>({
    name: "",
    category: "",
    condition: "",
    conditionNote: "",
    description: "",
    oemNumber: "",
    sourceVin: "",
    compatibility: [{ brand: "", model: "", yearFrom: "", yearTo: "" }],
  });
  const [pricing, setPricing] = useState<PricingData>({
    price: "",
    vatIncluded: true,
    quantity: "1",
    deliveryOptions: ["PICKUP"],
  });

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const validCompat = details.compatibility.filter((c) => c.brand);
      const body = {
        name: details.name,
        category: details.category,
        condition: details.condition,
        description: details.description || undefined,
        oemNumber: details.oemNumber || undefined,
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
        // Photos would be uploaded via separate endpoint
      };

      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/parts/my");
      } else {
        // Fallback demo mode
        router.push("/parts/my");
      }
    } catch {
      // Fallback demo mode
      router.push("/parts/my");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          onPublish={handlePublish}
          submitting={submitting}
        />
      )}
    </AddPartWizard>
  );
}
