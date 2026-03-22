"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { DraftProvider } from "@/lib/hooks/useDraft";
import type { VehicleDraft } from "@/types/vehicle-draft";

function EditPageContent() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  const { createDraft, updateSection, updateStep } = useDraftContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVehicle() {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (!response.ok) {
          throw new Error("Vozidlo nenalezeno");
        }
        const vehicle = (await response.json()) as Record<string, unknown>;

        // Vytvorit draft a naplnit daty z API
        const draftId = await createDraft();

        // Namapovat data z API do draft formatu
        const contactData: Partial<VehicleDraft["contact"]> = {
          sellerName: vehicle.sellerName as string | undefined,
          sellerPhone: vehicle.sellerPhone as string | undefined,
          sellerEmail: vehicle.sellerEmail as string | undefined,
          leadSource: vehicle.leadSource as VehicleDraft["contact"] extends { leadSource: infer T } ? T : undefined,
          leadUrl: vehicle.leadUrl as string | undefined,
        };

        const detailsData: Partial<NonNullable<VehicleDraft["details"]>> = {
          brand: vehicle.brand as string,
          model: vehicle.model as string,
          variant: vehicle.variant as string | undefined,
          year: vehicle.year as number,
          mileage: vehicle.mileage as number,
          fuelType: vehicle.fuelType as string,
          transmission: vehicle.transmission as string,
          enginePower: vehicle.enginePower as number | undefined,
          engineCapacity: vehicle.engineCapacity as number | undefined,
          bodyType: vehicle.bodyType as string | undefined,
          color: vehicle.color as string | undefined,
          doorsCount: vehicle.doorsCount as number | undefined,
          seatsCount: vehicle.seatsCount as number | undefined,
          drivetrain: vehicle.drivetrain as string | undefined,
          condition: vehicle.condition as string,
          serviceBook: vehicle.serviceBook as boolean,
          serviceBookStatus: vehicle.serviceBookStatus as string | undefined,
          odometerStatus: vehicle.odometerStatus as string | undefined,
          ownerCount: vehicle.ownerCount as number | undefined,
          originCountry: vehicle.originCountry as string | undefined,
          vehicleSource: vehicle.vehicleSource as string | undefined,
          equipment: vehicle.equipment ? JSON.parse(vehicle.equipment as string) : [],
          highlights: vehicle.highlights ? JSON.parse(vehicle.highlights as string) : [],
          description: vehicle.description as string | undefined,
        };

        const pricingData: Partial<NonNullable<VehicleDraft["pricing"]>> = {
          price: vehicle.price as number,
          priceNegotiable: vehicle.priceNegotiable as boolean,
          vatStatus: vehicle.vatStatus as string | undefined,
          commission: vehicle.commission as number | undefined,
          city: vehicle.city as string,
          district: vehicle.district as string | undefined,
          latitude: vehicle.latitude as number | undefined,
          longitude: vehicle.longitude as number | undefined,
        };

        const vinData: Partial<NonNullable<VehicleDraft["vin"]>> = {
          vin: vehicle.vin as string,
          vinVerified: true,
        };

        updateSection("contact", contactData);
        updateSection("details", detailsData);
        updateSection("pricing", pricingData);
        updateSection("vin", vinData);
        updateStep(1);

        // Redirect do flow s prefilled daty
        router.replace(`/makler/vehicles/new/contact?draft=${draftId}&edit=${vehicleId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chyba pri nacitani");
      } finally {
        setLoading(false);
      }
    }
    loadVehicle();
  // Intentionally run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-red-500"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{error}</h2>
        <button
          onClick={() => router.push("/makler/vehicles")}
          className="text-orange-500 font-semibold mt-4"
        >
          Zpet na seznam vozu
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nacitam data vozidla...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function EditVehiclePage() {
  return (
    <DraftProvider>
      <EditPageContent />
    </DraftProvider>
  );
}
