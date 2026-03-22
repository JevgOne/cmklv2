"use client";

import { useState, useCallback } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { Step1Vin } from "./Step1Vin";
import { Step2Details } from "./Step2Details";
import { Step3Equipment } from "./Step3Equipment";
import { Step4Photos } from "./Step4Photos";
import { Step5PriceContact } from "./Step5PriceContact";
import { Step6Preview } from "./Step6Preview";
import type { VinDecoderResult } from "@/types/vehicle-draft";

export interface ListingFormData {
  // Step 1 - VIN
  vin: string;
  vinDecoded: boolean;
  vinData: VinDecoderResult | null;

  // Step 2 - Vehicle details
  brand: string;
  model: string;
  variant: string;
  year: string;
  bodyType: string;
  fuelType: string;
  engineCapacity: string;
  enginePower: string;
  transmission: string;
  drivetrain: string;
  color: string;
  doorsCount: string;
  seatsCount: string;
  mileage: string;
  condition: string;
  ownerCount: string;
  stkValidUntil: string;
  serviceBook: boolean;
  odometerStatus: string;

  // Step 3 - Equipment
  equipment: string[];
  customEquipment: string[];
  highlights: string[];

  // Step 4 - Photos
  photos: PhotoFile[];

  // Step 5 - Price & Contact
  price: string;
  priceNegotiable: boolean;
  vatStatus: string;
  city: string;
  district: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  wantBrokerHelp: boolean;

  // Step 6 meta
  status: "DRAFT" | "ACTIVE";
}

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  order: number;
}

const initialFormData: ListingFormData = {
  vin: "",
  vinDecoded: false,
  vinData: null,
  brand: "",
  model: "",
  variant: "",
  year: "",
  bodyType: "",
  fuelType: "",
  engineCapacity: "",
  enginePower: "",
  transmission: "",
  drivetrain: "",
  color: "",
  doorsCount: "",
  seatsCount: "",
  mileage: "",
  condition: "",
  ownerCount: "",
  stkValidUntil: "",
  serviceBook: false,
  odometerStatus: "",
  equipment: [],
  customEquipment: [],
  highlights: [],
  photos: [],
  price: "",
  priceNegotiable: false,
  vatStatus: "",
  city: "",
  district: "",
  description: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  wantBrokerHelp: false,
  status: "ACTIVE",
};

const STEPS = [
  { num: 1, label: "VIN" },
  { num: 2, label: "Údaje" },
  { num: 3, label: "Výbava" },
  { num: 4, label: "Fotky" },
  { num: 5, label: "Cena" },
  { num: 6, label: "Náhled" },
];

export function ListingFormWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ListingFormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateData = useCallback((updates: Partial<ListingFormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const goTo = (s: number) => {
    if (s < step) setStep(s);
  };

  const handleSubmit = async (asDraft: boolean) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        vin: data.vin || undefined,
        brand: data.brand,
        model: data.model,
        variant: data.variant || undefined,
        year: Number(data.year),
        mileage: Number(data.mileage),
        fuelType: data.fuelType,
        transmission: data.transmission,
        enginePower: data.enginePower ? Number(data.enginePower) : undefined,
        engineCapacity: data.engineCapacity ? Number(data.engineCapacity) : undefined,
        bodyType: data.bodyType || undefined,
        color: data.color || undefined,
        doorsCount: data.doorsCount ? Number(data.doorsCount) : undefined,
        seatsCount: data.seatsCount ? Number(data.seatsCount) : undefined,
        drivetrain: data.drivetrain || undefined,
        condition: data.condition,
        ownerCount: data.ownerCount ? Number(data.ownerCount) : undefined,
        stkValidUntil: data.stkValidUntil || undefined,
        serviceBook: data.serviceBook,
        odometerStatus: data.odometerStatus || undefined,
        price: Number(data.price),
        priceNegotiable: data.priceNegotiable,
        vatStatus: data.vatStatus || undefined,
        city: data.city,
        district: data.district || undefined,
        description: data.description || undefined,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || undefined,
        equipment: [...data.equipment, ...data.customEquipment],
        highlights: data.highlights,
        wantBrokerHelp: data.wantBrokerHelp,
        status: asDraft ? "DRAFT" : "ACTIVE",
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Nepodařilo se vytvořit inzerát");
      }

      const result = await res.json();

      // Upload photos if we have any
      const listingId = result.listing?.id;
      if (data.photos.length > 0 && listingId) {
        const formData = new FormData();
        data.photos.forEach((photo, index) => {
          formData.append("photos", photo.file);
          formData.append(`order_${index}`, String(photo.order));
          formData.append(`isPrimary_${index}`, String(photo.isPrimary));
        });

        await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          body: formData,
        });
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nepodařilo se vytvořit inzerát");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[40px] mx-auto">
          &#10003;
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-6">
          {data.status === "DRAFT" ? "Koncept uložen!" : "Inzerát publikován!"}
        </h2>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          {data.status === "DRAFT"
            ? "Váš koncept byl uložen. Můžete ho kdykoliv dokončit a publikovat."
            : "Váš inzerát je nyní viditelný pro kupující."}
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <a href="/moje-inzeraty" className="no-underline">
            <button className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 py-3 px-6 text-[15px] bg-white text-gray-800 shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50">
              Moje inzeráty
            </button>
          </a>
          <a href="/inzerce/pridat" className="no-underline">
            <button className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 py-3 px-6 text-[15px] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5">
              Vložit další inzerát
            </button>
          </a>
        </div>
      </div>
    );
  }

  const progress = (step / 6) * 100;

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => goTo(s.num)}
              className={cn(
                "flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer transition-all",
                s.num < step && "cursor-pointer",
                s.num > step && "cursor-default opacity-50"
              )}
              disabled={s.num > step}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  s.num === step
                    ? "bg-orange-500 text-white"
                    : s.num < step
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {s.num < step ? "\u2713" : s.num}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  s.num === step ? "text-gray-900" : "text-gray-400"
                )}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Steps */}
      {step === 1 && <Step1Vin data={data} updateData={updateData} onNext={next} />}
      {step === 2 && <Step2Details data={data} updateData={updateData} onNext={next} onPrev={prev} />}
      {step === 3 && <Step3Equipment data={data} updateData={updateData} onNext={next} onPrev={prev} />}
      {step === 4 && <Step4Photos data={data} updateData={updateData} onNext={next} onPrev={prev} />}
      {step === 5 && <Step5PriceContact data={data} updateData={updateData} onNext={next} onPrev={prev} />}
      {step === 6 && (
        <Step6Preview
          data={data}
          onPrev={prev}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
          goTo={goTo}
        />
      )}
    </div>
  );
}
