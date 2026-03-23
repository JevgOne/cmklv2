"use client";

import { Card } from "@/components/ui/Card";
import type { ContractContent, ContractSection } from "@/lib/contract-templates";

interface ContractData {
  id: string;
  type: string;
  status: string;
  content: string | null;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string | null;
  price: number | null;
  commission: number | null;
  signedAt: string | null;
  signedLocation: string | null;
  sellerSignature: string | null;
  brokerSignature: string | null;
  pdfUrl: string | null;
  vehicle: {
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    mileage: number;
    vin: string;
    price: number;
    condition: string;
    fuelType: string;
    transmission: string;
  } | null;
  broker: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface ContractPreviewProps {
  contract: ContractData;
}

function SectionBlock({ section }: { section: ContractSection }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-900">{section.heading}</h3>
      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
        {section.content}
      </div>
    </div>
  );
}

export function ContractPreview({ contract }: ContractPreviewProps) {
  let content: ContractContent | null = null;
  try {
    if (contract.content) {
      content = JSON.parse(contract.content) as ContractContent;
    }
  } catch {
    // Invalid content JSON
  }

  return (
    <Card className="overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Carmakler
          </span>
          {content?.contractNumber && (
            <span className="text-xs opacity-80">
              {content.contractNumber}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold mt-2">
          {content?.title ||
            (contract.type === "BROKERAGE"
              ? "Zprostředkovatelská smlouva"
              : "Předávací protokol")}
        </h2>
        {content?.date && (
          <p className="text-sm opacity-80 mt-1">{content.date}</p>
        )}
      </div>

      {/* Sections */}
      <div className="p-5 space-y-5">
        {content?.sections?.map((section, idx) => (
          <SectionBlock key={idx} section={section} />
        ))}

        {!content && (
          <div className="space-y-3">
            {/* Fallback without parsed content */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Prodejce</h3>
              <p className="text-sm text-gray-700">{contract.sellerName}</p>
              <p className="text-sm text-gray-500">{contract.sellerPhone}</p>
              {contract.sellerEmail && (
                <p className="text-sm text-gray-500">{contract.sellerEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Makléř</h3>
              <p className="text-sm text-gray-700">
                {contract.broker.firstName} {contract.broker.lastName}
              </p>
            </div>
            {contract.vehicle && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Vozidlo</h3>
                <p className="text-sm text-gray-700">
                  {contract.vehicle.brand} {contract.vehicle.model}{" "}
                  {contract.vehicle.variant} ({contract.vehicle.year})
                </p>
                <p className="text-sm text-gray-500">
                  VIN: {contract.vehicle.vin}
                </p>
              </div>
            )}
            {contract.price && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Cena</h3>
                <p className="text-sm text-gray-700">
                  {new Intl.NumberFormat("cs-CZ", {
                    style: "currency",
                    currency: "CZK",
                    maximumFractionDigits: 0,
                  }).format(contract.price)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Signatures */}
        {(contract.sellerSignature || contract.brokerSignature) && (
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Podpisy</h3>
            <div className="grid grid-cols-2 gap-4">
              {contract.sellerSignature && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Prodejce
                  </p>
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contract.sellerSignature}
                      alt="Podpis prodejce"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-600">{contract.sellerName}</p>
                </div>
              )}
              {contract.brokerSignature && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Makléř
                  </p>
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contract.brokerSignature}
                      alt="Podpis makléře"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {contract.broker.firstName} {contract.broker.lastName}
                  </p>
                </div>
              )}
            </div>
            {contract.signedAt && (
              <p className="text-xs text-gray-400">
                Podepsáno: {new Date(contract.signedAt).toLocaleString("cs-CZ")}
                {contract.signedLocation && ` | GPS: ${contract.signedLocation}`}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
