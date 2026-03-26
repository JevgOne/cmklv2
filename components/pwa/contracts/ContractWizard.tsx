"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TypeStep } from "./steps/TypeStep";
import { VehicleStep } from "./steps/VehicleStep";
import { DetailsStep } from "./steps/DetailsStep";
import { PreviewStep } from "./steps/PreviewStep";

export interface WizardData {
  type: "BROKERAGE" | "HANDOVER" | null;
  vehicleId: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    mileage: number;
    vin: string;
    price: number;
    condition: string;
    color: string | null;
    fuelType: string;
    transmission: string;
    enginePower: number | null;
    sellerName: string | null;
    sellerPhone: string | null;
    sellerEmail: string | null;
  } | null;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;
  sellerIdNumber: string;
  sellerIdCard: string;
  sellerBankAccount: string;
  price: number;
  commission: number;
  exclusiveDuration: number | null;
}

const STEPS = ["Typ smlouvy", "Vozidlo", "Údaje", "Náhled"];

interface ContractWizardProps {
  brokerId?: string;
  brokerName?: string;
}

export function ContractWizard({ brokerId = "", brokerName = "" }: ContractWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
    type: null,
    vehicleId: null,
    vehicle: null,
    sellerName: "",
    sellerPhone: "",
    sellerEmail: "",
    sellerAddress: "",
    sellerIdNumber: "",
    sellerIdCard: "",
    sellerBankAccount: "",
    price: 0,
    commission: 0,
    exclusiveDuration: null,
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleClose = () => {
    router.push("/makler/contracts");
  };

  const handleBack = () => {
    if (step === 0) {
      handleClose();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !data.type) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          vehicleId: data.vehicleId,
          sellerName: data.sellerName,
          sellerPhone: data.sellerPhone,
          sellerEmail: data.sellerEmail || undefined,
          sellerAddress: data.sellerAddress || undefined,
          sellerIdNumber: data.sellerIdNumber || undefined,
          sellerIdCard: data.sellerIdCard || undefined,
          sellerBankAccount: data.sellerBankAccount || undefined,
          price: data.price,
          commission: data.commission || undefined,
          exclusiveDuration: data.exclusiveDuration || undefined,
          vehicleBrand: data.vehicle?.brand,
          vehicleModel: data.vehicle?.model,
          vehicleVariant: data.vehicle?.variant,
          vehicleVin: data.vehicle?.vin,
          vehicleYear: data.vehicle?.year,
          vehicleMileage: data.vehicle?.mileage,
          vehicleCondition: data.vehicle?.condition,
          vehicleColor: data.vehicle?.color,
          vehicleFuelType: data.vehicle?.fuelType,
          vehicleTransmission: data.vehicle?.transmission,
          vehicleEnginePower: data.vehicle?.enginePower,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chyba při vytváření smlouvy");
      }

      const { contract } = await res.json();
      router.push(`/makler/contracts/${contract.id}/sign`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Chyba při vytváření smlouvy");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors border-none bg-transparent cursor-pointer"
              aria-label="Zpět"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <h1 className="text-lg font-bold text-gray-900">{STEPS[step]}</h1>

            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
              aria-label="Zavřít"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Krok {step + 1} / {STEPS.length}</span>
              <span>{Math.round(progress)} %</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
          <button onClick={() => setSubmitError(null)} className="text-red-400 hover:text-red-600 p-0.5" aria-label="Zavřít chybu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <TypeStep
            selectedType={data.type}
            onSelect={(type) => {
              updateData({ type });
              handleNext();
            }}
          />
        )}
        {step === 1 && (
          <VehicleStep
            brokerId={brokerId}
            selectedVehicleId={data.vehicleId}
            onSelect={(vehicle) => {
              updateData({
                vehicleId: vehicle.id,
                vehicle,
                sellerName: vehicle.sellerName || data.sellerName,
                sellerPhone: vehicle.sellerPhone || data.sellerPhone,
                sellerEmail: vehicle.sellerEmail || data.sellerEmail,
                price: vehicle.price || data.price,
                commission: vehicle.price ? Math.max(25000, Math.round(vehicle.price * 0.05)) : data.commission,
              });
              handleNext();
            }}
          />
        )}
        {step === 2 && (
          <DetailsStep
            data={data}
            brokerName={brokerName}
            onUpdate={updateData}
            onNext={handleNext}
          />
        )}
        {step === 3 && (
          <PreviewStep
            data={data}
            brokerName={brokerName}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
