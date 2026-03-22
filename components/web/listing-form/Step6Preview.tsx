"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import type { ListingFormData } from "./ListingFormWizard";

interface Step6Props {
  data: ListingFormData;
  onPrev: () => void;
  onSubmit: (asDraft: boolean) => void;
  submitting: boolean;
  submitError: string | null;
  goTo: (step: number) => void;
}

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transLabels: Record<string, string> = {
  MANUAL: "Manuální",
  AUTOMATIC: "Automatická",
  DSG: "DSG",
  CVT: "CVT",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborný stav",
  GOOD: "Dobrý stav",
  FAIR: "Uspokojivý",
  DAMAGED: "Poškozené",
};

interface CheckItem {
  label: string;
  ok: boolean;
  step: number;
}

export function Step6Preview({ data, onPrev, onSubmit, submitting, submitError, goTo }: Step6Props) {
  const formatPrice = (value: string): string => {
    if (!value) return "0";
    return new Intl.NumberFormat("cs-CZ").format(Number(value));
  };

  const allEquipment = [...data.equipment, ...data.customEquipment];
  const primaryPhoto = data.photos.find((p) => p.isPrimary) || data.photos[0];

  // Completeness checklist
  const checks: CheckItem[] = [
    { label: "Značka a model", ok: !!data.brand && !!data.model, step: 2 },
    { label: "Rok výroby", ok: !!data.year, step: 2 },
    { label: "Palivo a převodovka", ok: !!data.fuelType && !!data.transmission, step: 2 },
    { label: "Nájezd", ok: !!data.mileage, step: 2 },
    { label: "Stav vozidla", ok: !!data.condition, step: 2 },
    { label: "Fotografie (min. 3)", ok: data.photos.length >= 3, step: 4 },
    { label: "Cena", ok: !!data.price, step: 5 },
    { label: "Město", ok: !!data.city, step: 5 },
    { label: "Kontaktní jméno", ok: !!data.contactName, step: 5 },
    { label: "Kontaktní telefon", ok: !!data.contactPhone, step: 5 },
  ];

  const allComplete = checks.every((c) => c.ok);

  return (
    <div className="space-y-6">
      {/* Preview card */}
      <Card className="overflow-hidden">
        {/* Main photo */}
        {primaryPhoto && (
          <div className="relative aspect-[16/9] bg-gray-100">
            <img
              src={primaryPhoto.preview}
              alt="Hlavní fotka"
              className="w-full h-full object-cover"
            />
            {data.photos.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                +{data.photos.length - 1} fotek
              </span>
            )}
          </div>
        )}

        <div className="p-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {data.brand} {data.model} {data.variant}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {data.year && `${data.year}`}
                {data.mileage && ` \u00b7 ${new Intl.NumberFormat("cs-CZ").format(Number(data.mileage))} km`}
                {data.fuelType && ` \u00b7 ${fuelLabels[data.fuelType] || data.fuelType}`}
                {data.transmission && ` \u00b7 ${transLabels[data.transmission] || data.transmission}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-extrabold text-gray-900">
                {formatPrice(data.price)} Kč
              </div>
              {data.priceNegotiable && (
                <Badge variant="default">K jednání</Badge>
              )}
            </div>
          </div>

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.highlights.map((h) => (
                <span key={h} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            {data.bodyType && (
              <DetailItem label="Karoserie" value={data.bodyType} />
            )}
            {data.enginePower && (
              <DetailItem label="Výkon" value={`${data.enginePower} kW`} />
            )}
            {data.engineCapacity && (
              <DetailItem label="Objem" value={`${data.engineCapacity} ccm`} />
            )}
            {data.drivetrain && (
              <DetailItem label="Pohon" value={data.drivetrain} />
            )}
            {data.color && (
              <DetailItem label="Barva" value={data.color} />
            )}
            {data.condition && (
              <DetailItem label="Stav" value={conditionLabels[data.condition] || data.condition} />
            )}
            {data.ownerCount && (
              <DetailItem label="Majitelé" value={data.ownerCount} />
            )}
            {data.serviceBook && (
              <DetailItem label="Servisní knížka" value="Ano" />
            )}
            {data.stkValidUntil && (
              <DetailItem label="STK do" value={data.stkValidUntil} />
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Popis</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{data.description}</p>
            </div>
          )}

          {/* Equipment */}
          {allEquipment.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Výbava ({allEquipment.length})</h3>
              <div className="flex flex-wrap gap-2">
                {allEquipment.map((e) => (
                  <span key={e} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Kontakt</h3>
            <div className="text-sm text-gray-600">
              <p>{data.contactName}</p>
              <p>{data.contactPhone}</p>
              {data.contactEmail && <p>{data.contactEmail}</p>}
              <p className="text-gray-500">{data.city}{data.district && `, ${data.district}`}</p>
            </div>
          </div>

          {data.wantBrokerHelp && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-orange-700 font-medium">
                Požadována pomoc makléře Carmakler
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Completeness checklist */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kontrolní seznam</h3>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  check.ok
                    ? "bg-success-50 text-success-500"
                    : "bg-error-50 text-error-500"
                )}
              >
                {check.ok ? "\u2713" : "!"}
              </span>
              <span className={cn("text-sm", check.ok ? "text-gray-600" : "text-gray-900 font-medium")}>
                {check.label}
              </span>
              {!check.ok && (
                <button
                  type="button"
                  onClick={() => goTo(check.step)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer bg-transparent border-none ml-auto"
                >
                  Doplnit
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {submitError && (
        <Alert variant="error">{submitError}</Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button variant="ghost" onClick={onPrev}>
          &larr; Zpět
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onSubmit(true)}
            disabled={submitting}
          >
            {submitting ? "Ukládám..." : "Uložit koncept"}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onSubmit(false)}
            disabled={submitting || !allComplete}
          >
            {submitting ? "Publikuji..." : "Publikovat inzerát"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
