"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface LeadPrefillData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  expectedPrice: number | null;
  description: string | null;
  city: string | null;
  vehicleId: string | null;
}

export function LeadPrefillRedirect({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { createDraft, updateSection, saveDraft } = useDraftContext();
  const [error, setError] = useState<string | null>(null);
  const [existingVehicleId, setExistingVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function prefillFromLead() {
      try {
        const res = await fetch(`/api/leads/${leadId}/prefill`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as Record<string, string>).error || "Lead nenalezen nebo nemáte oprávnění.");
          setLoading(false);
          return;
        }

        const { lead } = (await res.json()) as { lead: LeadPrefillData };

        // Check if lead already has a vehicle
        if (lead.vehicleId) {
          setExistingVehicleId(lead.vehicleId);
          setLoading(false);
          return;
        }

        if (cancelled) return;

        // Create draft
        const draftId = await createDraft();

        // Prefill contact section
        updateSection("contact", {
          sellerName: lead.name,
          sellerPhone: lead.phone,
          sellerEmail: lead.email ?? undefined,
          prelimBrand: lead.brand ?? undefined,
          prelimModel: lead.model ?? undefined,
          prelimYear: lead.year ?? undefined,
          prelimMileage: lead.mileage ?? undefined,
          prelimPrice: lead.expectedPrice ?? undefined,
          leadId: lead.id,
        });

        // Prefill details
        if (lead.brand || lead.model || lead.year || lead.mileage) {
          updateSection("details", {
            brand: lead.brand ?? undefined,
            model: lead.model ?? undefined,
            year: lead.year ?? undefined,
            mileage: lead.mileage ?? undefined,
          });
        }

        // Prefill pricing
        if (lead.expectedPrice || lead.city) {
          updateSection("pricing", {
            price: lead.expectedPrice ?? undefined,
            city: lead.city ?? undefined,
          });
        }

        // Prefill description if available
        if (lead.description) {
          updateSection("details", {
            description: lead.description,
          });
        }

        await saveDraft();

        if (!cancelled) {
          router.replace(`/makler/vehicles/new/vin?draft=${draftId}`);
        }
      } catch {
        if (!cancelled) {
          setError("Chyba při přípravě draftu z leadu.");
          setLoading(false);
        }
      }
    }

    prefillFromLead();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Lead already has a vehicle — show warning
  if (existingVehicleId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] p-6 text-center">
        <Alert variant="warning">
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Tento lead už má propojené vozidlo
            </p>
            <p className="text-sm">
              Můžete zobrazit existující vozidlo nebo vytvořit nový draft.
            </p>
          </div>
        </Alert>
        <div className="flex gap-3 mt-6">
          <Link href={`/makler/vehicles/${existingVehicleId}`}>
            <Button variant="primary">Zobrazit vozidlo</Button>
          </Link>
          <Button
            variant="outline"
            onClick={async () => {
              setExistingVehicleId(null);
              setLoading(true);
              // Force re-create by clearing vehicleId check
              const res = await fetch(`/api/leads/${leadId}/prefill`);
              if (!res.ok) {
                setError("Chyba při načítání leadu.");
                setLoading(false);
                return;
              }
              const { lead } = (await res.json()) as { lead: LeadPrefillData };
              const draftId = await createDraft();
              updateSection("contact", {
                sellerName: lead.name,
                sellerPhone: lead.phone,
                sellerEmail: lead.email ?? undefined,
                prelimBrand: lead.brand ?? undefined,
                prelimModel: lead.model ?? undefined,
                leadId: lead.id,
              });
              if (lead.brand || lead.model || lead.year || lead.mileage) {
                updateSection("details", {
                  brand: lead.brand ?? undefined,
                  model: lead.model ?? undefined,
                  year: lead.year ?? undefined,
                  mileage: lead.mileage ?? undefined,
                });
              }
              if (lead.expectedPrice || lead.city) {
                updateSection("pricing", {
                  price: lead.expectedPrice ?? undefined,
                  city: lead.city ?? undefined,
                });
              }
              await saveDraft();
              router.replace(`/makler/vehicles/new/vin?draft=${draftId}`);
            }}
          >
            Vytvořit nový draft
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] p-6 text-center">
        <Alert variant="error">
          <span className="text-sm">{error}</span>
        </Alert>
        <Link href="/makler/leads" className="mt-4">
          <Button variant="outline">Zpět na leady</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-500">Připravuji draft z leadu...</p>
      </div>
    );
  }

  return null;
}
