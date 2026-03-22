"use client";

import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { WizardData } from "../ContractWizard";

interface PreviewStepProps {
  data: WizardData;
  brokerName: string;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PreviewStep({
  data,
  brokerName,
  onSubmit,
  isSubmitting,
}: PreviewStepProps) {
  const contractTitle =
    data.type === "BROKERAGE"
      ? "Zprostředkovatelská smlouva"
      : "Předávací protokol";

  const today = new Date().toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6">
      {/* Contract preview styled as document */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">CARMAKLER</p>
              <h2 className="text-xl font-extrabold mt-1">{contractTitle}</h2>
            </div>
            <div className="text-right text-sm text-white/80">
              <p>{today}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Smluvní strany */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              I. Smluvní strany
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Zprostředkovatel</p>
                <p className="font-bold text-sm text-gray-900">
                  Carmakler s.r.o.
                </p>
                <p className="text-sm text-gray-600">
                  zastoupený makléřem: {brokerName}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Prodejce</p>
                <p className="font-bold text-sm text-gray-900">
                  {data.sellerName}
                </p>
                <p className="text-sm text-gray-600">{data.sellerPhone}</p>
                {data.sellerEmail && (
                  <p className="text-sm text-gray-600">{data.sellerEmail}</p>
                )}
                {data.sellerAddress && (
                  <p className="text-sm text-gray-600">{data.sellerAddress}</p>
                )}
              </div>
            </div>
          </section>

          {/* Vozidlo */}
          {data.vehicle && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                II. Předmět smlouvy
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="font-bold text-sm text-gray-900">
                  {data.vehicle.brand} {data.vehicle.model}{" "}
                  {data.vehicle.variant || ""}
                </p>
                <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                  <p>VIN: {data.vehicle.vin}</p>
                  <p>Rok: {data.vehicle.year}</p>
                  <p>
                    Tachometr:{" "}
                    {new Intl.NumberFormat("cs-CZ").format(
                      data.vehicle.mileage
                    )}{" "}
                    km
                  </p>
                  {data.vehicle.color && <p>Barva: {data.vehicle.color}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Cena */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              III. Cena a provize
            </h3>
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-sm text-gray-600">Prodejní cena</p>
                <p className="font-extrabold text-lg text-gray-900">
                  {formatPrice(data.price)}
                </p>
              </div>
              {data.commission > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Provize</p>
                  <p className="font-bold text-orange-600">
                    {formatPrice(data.commission)}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Podmínky placeholder */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              IV. Podmínky
            </h3>
            <p className="text-xs text-gray-400 italic leading-relaxed">
              Standardní podmínky zprostředkování dle obchodních podmínek
              Carmakler s.r.o. Finální text podmínek bude doplněn.
            </p>
          </section>

          {/* Podpisy placeholder */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Podpisy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-t-2 border-gray-200 pt-2">
                <p className="text-xs text-gray-500">Prodejce</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {data.sellerName}
                </p>
              </div>
              <div className="border-t-2 border-gray-200 pt-2">
                <p className="text-xs text-gray-500">Makléř</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {brokerName}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 mt-6">
        <Button
          variant="primary"
          className="w-full"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Vytvářím smlouvu..." : "Pokračovat k podpisu"}
        </Button>
      </div>
    </div>
  );
}
