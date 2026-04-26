"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddPartWizard } from "@/components/pwa-parts/parts/AddPartWizard";
import { PhotoStep } from "@/components/pwa-parts/parts/PhotoStep";
import { DetailsStep, type PartDetails } from "@/components/pwa-parts/parts/DetailsStep";
import { PricingStep, type PricingData } from "@/components/pwa-parts/parts/PricingStep";
import { ModeSelector } from "@/components/pwa-parts/parts/ModeSelector";
import { DonorVehicleStep, type VehicleData } from "@/components/pwa-parts/parts/DonorVehicleStep";
import { DisposalTypeStep } from "@/components/pwa-parts/parts/DisposalTypeStep";
import { DamageZoneSelector } from "@/components/pwa-parts/parts/DamageZoneSelector";
import { PartsFilterStep, type SelectedPart } from "@/components/pwa-parts/parts/PartsFilterStep";
import { DonorPhotosStep } from "@/components/pwa-parts/parts/DonorPhotosStep";
import { BulkPricingStep, type PricedPart } from "@/components/pwa-parts/parts/BulkPricingStep";
import { DonorSummaryStep } from "@/components/pwa-parts/parts/DonorSummaryStep";
import { getDefaultDamageZones, type DamageZone, type DamageLevel } from "@/lib/damage-zones";

type Mode = "choose" | "single" | "donor";
type SingleStep = 1 | 2 | 3;
type DonorStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function NewPartPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  // ── Single part state (original) ──
  const [singleStep, setSingleStep] = useState<SingleStep>(1);
  const [submitting, setSubmitting] = useState(false);
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

  // ── Donor car state ──
  const [donorStep, setDonorStep] = useState<DonorStep>(1);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [disposalType, setDisposalType] = useState<string | null>(null);
  const [damageZones, setDamageZones] = useState<Record<DamageZone, DamageLevel>>(getDefaultDamageZones());
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [donorPhotos, setDonorPhotos] = useState<string[]>(["", "", "", ""]);
  const [pricedParts, setPricedParts] = useState<PricedPart[]>([]);

  // ── Single part handlers ──
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

      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/parts/my");
      } else {
        router.push("/parts/my");
      }
    } catch {
      router.push("/parts/my");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Donor car handlers ──
  const handleDisposalSelect = (type: string) => {
    setDisposalType(type);
    if (type === "COMPLETE") {
      // Skip damage zones for complete disassembly
      setDonorStep(4);
    } else {
      setDonorStep(3);
    }
  };

  const handlePartsToPhotos = () => {
    // Convert selectedParts to pricedParts with suggested prices
    const priced: PricedPart[] = selectedParts.map((p) => ({
      ...p,
      price: p.suggestedPrice[p.grade],
      priceByAgreement: false,
    }));
    setPricedParts(priced);
    setDonorStep(5);
  };

  // ── Mode: choose ──
  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-3 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Přidat díly
          </h1>
        </div>
        <div className="max-w-lg mx-auto">
          <ModeSelector
            onSelectDonor={() => setMode("donor")}
            onSelectSingle={() => setMode("single")}
          />
        </div>
      </div>
    );
  }

  // ── Mode: single (original 3-step wizard) ──
  if (mode === "single") {
    return (
      <AddPartWizard currentStep={singleStep} mode="single">
        {singleStep === 1 && (
          <PhotoStep
            photos={photos}
            onPhotosChange={setPhotos}
            onNext={() => setSingleStep(2)}
          />
        )}
        {singleStep === 2 && (
          <DetailsStep
            details={details}
            onDetailsChange={setDetails}
            onNext={() => setSingleStep(3)}
            onBack={() => setSingleStep(1)}
          />
        )}
        {singleStep === 3 && (
          <PricingStep
            pricing={pricing}
            onPricingChange={setPricing}
            details={details}
            photos={photos}
            onBack={() => setSingleStep(2)}
            onPublish={handlePublish}
            submitting={submitting}
          />
        )}
      </AddPartWizard>
    );
  }

  // ── Mode: donor (8-step wizard) ──
  return (
    <AddPartWizard currentStep={donorStep} mode="donor">
      {donorStep === 1 && (
        <DonorVehicleStep
          vehicleData={vehicleData}
          onVehicleConfirmed={(data) => {
            setVehicleData(data);
            setDonorStep(2);
          }}
          onBack={() => setMode("choose")}
        />
      )}
      {donorStep === 2 && (
        <DisposalTypeStep
          disposalType={disposalType}
          onSelect={handleDisposalSelect}
          onBack={() => setDonorStep(1)}
        />
      )}
      {donorStep === 3 && (
        <DamageZoneSelector
          disposalType={disposalType!}
          damageZones={damageZones}
          onChange={setDamageZones}
          onNext={() => setDonorStep(4)}
          onBack={() => setDonorStep(2)}
        />
      )}
      {donorStep === 4 && (
        <PartsFilterStep
          kTypeId={vehicleData?.kTypeId ?? null}
          damageZones={damageZones}
          selectedParts={selectedParts}
          onPartsChange={setSelectedParts}
          onNext={handlePartsToPhotos}
          onBack={() =>
            setDonorStep(disposalType === "COMPLETE" ? 2 : 3)
          }
        />
      )}
      {donorStep === 5 && (
        <DonorPhotosStep
          photos={donorPhotos}
          onPhotosChange={setDonorPhotos}
          onNext={() => setDonorStep(6)}
          onBack={() => setDonorStep(4)}
        />
      )}
      {donorStep === 6 && (
        <BulkPricingStep
          parts={pricedParts}
          onPartsChange={setPricedParts}
          onNext={() => setDonorStep(7)}
          onBack={() => setDonorStep(5)}
        />
      )}
      {donorStep === 7 && vehicleData && (
        <DonorSummaryStep
          vehicle={vehicleData}
          disposalType={disposalType!}
          damageZones={damageZones}
          photos={donorPhotos}
          parts={pricedParts}
          onBack={() => setDonorStep(6)}
        />
      )}
    </AddPartWizard>
  );
}
