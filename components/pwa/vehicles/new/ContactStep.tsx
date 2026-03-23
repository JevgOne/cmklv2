"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { StepLayout } from "./StepLayout";
import { ContactSearch } from "./ContactSearch";
import { useDraftContext } from "@/lib/hooks/useDraft";
import type { ContactData, LeadSource } from "@/types/vehicle-draft";

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "BAZOS", label: "Bazos.cz" },
  { value: "SAUTO", label: "Sauto.cz" },
  { value: "FACEBOOK", label: "Facebook Marketplace" },
  { value: "REFERRAL", label: "Doporučení" },
  { value: "COLD_CALL", label: "Studený kontakt" },
  { value: "OTHER", label: "Jiný zdroj" },
];

export function ContactStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, updateSection, updateStep } = useDraftContext();

  const contact = (draft?.contact ?? {}) as Partial<ContactData>;

  const [searchOpen, setSearchOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const update = useCallback(
    (data: Partial<ContactData>) => {
      updateSection("contact", { ...contact, ...data });
    },
    [contact, updateSection]
  );

  const handleNext = () => {
    updateStep(2);
    router.push(`/makler/vehicles/new/inspection?draft=${draftId}`);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const phone = contact.sellerPhone || "";
  const hasAddress = contact.address || (contact.latitude && contact.longitude);

  return (
    <StepLayout
      step={1}
      title="Kontakt"
      onNext={handleNext}
      nextDisabled={!contact.sellerName || !contact.sellerPhone}
    >
      <div className="space-y-6">
        {/* Zdroj leadu */}
        <Select
          label="Zdroj leadu"
          placeholder="Vyberte zdroj..."
          options={LEAD_SOURCES}
          value={contact.leadSource || ""}
          onChange={(e) => update({ leadSource: e.target.value as LeadSource })}
        />

        {contact.leadSource === "BAZOS" ||
        contact.leadSource === "SAUTO" ||
        contact.leadSource === "FACEBOOK" ? (
          <Input
            label="URL inzerátu"
            type="url"
            placeholder="https://..."
            value={contact.leadUrl || ""}
            onChange={(e) => update({ leadUrl: e.target.value })}
          />
        ) : null}

        {/* Kontakt prodejce */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Kontakt na prodejce
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
            >
              Hledat
            </Button>
          </div>

          <Input
            label="Jméno prodejce *"
            placeholder="Jan Novák"
            value={contact.sellerName || ""}
            onChange={(e) => update({ sellerName: e.target.value })}
          />

          <div className="space-y-2">
            <Input
              label="Telefon *"
              type="tel"
              placeholder="+420 xxx xxx xxx"
              value={phone}
              onChange={(e) => update({ sellerPhone: e.target.value })}
            />
            {phone && (
              <div className="flex gap-2">
                <a
                  href={`tel:${phone}`}
                  className="flex-1 text-center py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Zavolat
                </a>
                <a
                  href={`sms:${phone}`}
                  className="flex-1 text-center py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  SMS
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/\s/g, "").replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="jan@email.cz"
            value={contact.sellerEmail || ""}
            onChange={(e) => update({ sellerEmail: e.target.value })}
          />
        </div>

        {/* Předběžné info o autě */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Předběžné info o autě (volitelné)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Značka"
              placeholder="Škoda"
              value={contact.prelimBrand || ""}
              onChange={(e) => update({ prelimBrand: e.target.value })}
            />
            <Input
              label="Model"
              placeholder="Octavia"
              value={contact.prelimModel || ""}
              onChange={(e) => update({ prelimModel: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Rok"
              type="number"
              placeholder="2020"
              value={contact.prelimYear || ""}
              onChange={(e) =>
                update({ prelimYear: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Input
              label="Km"
              type="number"
              placeholder="50000"
              value={contact.prelimMileage || ""}
              onChange={(e) =>
                update({
                  prelimMileage: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              label="Cena (Kč)"
              type="number"
              placeholder="350000"
              value={contact.prelimPrice || ""}
              onChange={(e) =>
                update({
                  prelimPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Adresa */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Adresa / místo prohlídky
          </h3>

          <Input
            label="Adresa"
            placeholder="Ulice, město..."
            value={contact.address || ""}
            onChange={(e) => update({ address: e.target.value })}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleGeolocation}
            disabled={geoLoading}
            className="w-full"
          >
            {geoLoading ? "Zjišťuji polohu..." : "Použít aktuální polohu"}
          </Button>

          {contact.latitude && contact.longitude && (
            <div className="text-xs text-gray-400 text-center">
              GPS: {contact.latitude.toFixed(5)}, {contact.longitude.toFixed(5)}
            </div>
          )}

          {hasAddress && (
            <div className="flex gap-2">
              <a
                href={buildMapyCzUrl(contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Mapy.cz
              </a>
              <a
                href={buildGoogleMapsUrl(contact)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Termín schůzky */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Termín schůzky
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Datum"
              type="date"
              value={contact.appointmentDate || ""}
              onChange={(e) => update({ appointmentDate: e.target.value })}
            />
            <Input
              label="Čas"
              type="time"
              value={contact.appointmentTime || ""}
              onChange={(e) => update({ appointmentTime: e.target.value })}
            />
          </div>
        </div>

        {/* Poznámky */}
        <Textarea
          label="Poznámky"
          placeholder="Další informace o vozidle, prodejci..."
          value={contact.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>

      {/* Contact search modal */}
      <ContactSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(c) => {
          update({
            sellerName: c.name,
            sellerPhone: c.phone,
            sellerEmail: c.email,
          });
        }}
      />
    </StepLayout>
  );
}

function buildMapyCzUrl(contact: Partial<ContactData>): string {
  if (contact.latitude && contact.longitude) {
    return `https://mapy.cz/zakladni?x=${contact.longitude}&y=${contact.latitude}&z=16`;
  }
  return `https://mapy.cz/zakladni?q=${encodeURIComponent(contact.address || "")}`;
}

function buildGoogleMapsUrl(contact: Partial<ContactData>): string {
  if (contact.latitude && contact.longitude) {
    return `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address || "")}`;
}
