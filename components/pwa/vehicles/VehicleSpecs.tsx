"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMileage } from "@/lib/utils";

interface VehicleSpecsProps {
  vehicle: {
    vin: string;
    vinLocked: boolean;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    mileage: number;
    fuelType: string;
    transmission: string;
    enginePower: number | null;
    engineCapacity: number | null;
    bodyType: string | null;
    color: string | null;
    doorsCount: number | null;
    seatsCount: number | null;
    drivetrain: string | null;
    ownerCount: number | null;
    serviceBookStatus: string | null;
    odometerStatus: string | null;
    originCountry: string | null;
    condition: string;
    stkValidUntil: string | null;
    serviceBook: boolean;
    equipment: string | null;
    inspectionData: string | null;
    overallRating: number | null;
    description: string | null;
  };
}

const fuelLabels: Record<string, string> = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

const bodyTypeLabels: Record<string, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  COMBI: "Combi",
  SUV: "SUV",
  COUPE: "Coupe",
  CABRIO: "Cabrio",
  VAN: "Van",
  PICKUP: "Pickup",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborný",
  GOOD: "Dobrý",
  FAIR: "Uspokojivý",
  DAMAGED: "Poškozené",
};

const drivetrainLabels: Record<string, string> = {
  FWD: "Přední",
  RWD: "Zadní",
  AWD: "4x4 (AWD)",
  "4WD": "4x4",
};

const serviceBookLabels: Record<string, string> = {
  COMPLETE: "Kompletní",
  PARTIAL: "Částečná",
  NONE: "Chybí",
  ELECTRONIC: "Elektronická",
};

const TABS = [
  { value: "basic", label: "Základní" },
  { value: "condition", label: "Stav" },
  { value: "equipment", label: "Výbava" },
  { value: "inspection", label: "Prohlídka" },
  { value: "description", label: "Popis" },
];

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={star <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          className={`w-4 h-4 ${star <= rating ? "text-orange-500" : "text-gray-300"}`}
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

export function VehicleSpecs({ vehicle }: VehicleSpecsProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const equipmentList: string[] = vehicle.equipment
    ? (() => {
        try {
          return JSON.parse(vehicle.equipment);
        } catch {
          return [];
        }
      })()
    : [];

  const inspectionData = vehicle.inspectionData
    ? (() => {
        try {
          return JSON.parse(vehicle.inspectionData) as Record<string, unknown>;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div>
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="overflow-x-auto"
      />

      <Card className="mt-3 p-4">
        {activeTab === "basic" && (
          <div>
            <SpecRow
              label="VIN"
              value={
                <span className="font-mono text-xs">
                  {vehicle.vinLocked ? vehicle.vin : vehicle.vin}
                </span>
              }
            />
            <SpecRow label="Značka" value={vehicle.brand} />
            <SpecRow label="Model" value={vehicle.model} />
            {vehicle.variant && <SpecRow label="Varianta" value={vehicle.variant} />}
            <SpecRow label="Rok výroby" value={vehicle.year} />
            <SpecRow label="Nájezd" value={formatMileage(vehicle.mileage)} />
            <SpecRow label="Palivo" value={fuelLabels[vehicle.fuelType] || vehicle.fuelType} />
            <SpecRow label="Převodovka" value={transmissionLabels[vehicle.transmission] || vehicle.transmission} />
            {vehicle.enginePower && <SpecRow label="Výkon" value={`${vehicle.enginePower} kW`} />}
            {vehicle.engineCapacity && <SpecRow label="Objem" value={`${vehicle.engineCapacity} ccm`} />}
            {vehicle.bodyType && <SpecRow label="Karoserie" value={bodyTypeLabels[vehicle.bodyType] || vehicle.bodyType} />}
            {vehicle.color && <SpecRow label="Barva" value={vehicle.color} />}
            {vehicle.doorsCount && <SpecRow label="Dveře" value={vehicle.doorsCount} />}
            {vehicle.seatsCount && <SpecRow label="Místa" value={vehicle.seatsCount} />}
            {vehicle.drivetrain && <SpecRow label="Pohon" value={drivetrainLabels[vehicle.drivetrain] || vehicle.drivetrain} />}
          </div>
        )}

        {activeTab === "condition" && (
          <div>
            <SpecRow
              label="Stav vozu"
              value={
                <Badge variant={vehicle.condition === "DAMAGED" ? "rejected" : "verified"}>
                  {conditionLabels[vehicle.condition] || vehicle.condition}
                </Badge>
              }
            />
            <SpecRow
              label="STK do"
              value={
                vehicle.stkValidUntil
                  ? new Date(vehicle.stkValidUntil).toLocaleDateString("cs-CZ")
                  : "Neuvedeno"
              }
            />
            <SpecRow
              label="Servisní knížka"
              value={
                vehicle.serviceBookStatus
                  ? serviceBookLabels[vehicle.serviceBookStatus] || vehicle.serviceBookStatus
                  : vehicle.serviceBook ? "Ano" : "Ne"
              }
            />
            {vehicle.ownerCount != null && (
              <SpecRow label="Počet majitelů" value={vehicle.ownerCount} />
            )}
            {vehicle.originCountry && (
              <SpecRow label="Země původu" value={vehicle.originCountry} />
            )}
            {vehicle.odometerStatus && (
              <SpecRow
                label="Stav tachometru"
                value={
                  <Badge
                    variant={
                      vehicle.odometerStatus === "VERIFIED"
                        ? "verified"
                        : vehicle.odometerStatus === "TAMPERED"
                        ? "rejected"
                        : "pending"
                    }
                  >
                    {vehicle.odometerStatus === "VERIFIED"
                      ? "Ověřeno"
                      : vehicle.odometerStatus === "TAMPERED"
                      ? "Manipulováno"
                      : "Neověřeno"}
                  </Badge>
                }
              />
            )}
          </div>
        )}

        {activeTab === "equipment" && (
          <div>
            {equipmentList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {equipmentList.map((item: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Žádná výbava nezadána
              </p>
            )}
          </div>
        )}

        {activeTab === "inspection" && (
          <div>
            {vehicle.overallRating != null && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-sm text-gray-500">Celkové hodnocení</span>
                <StarDisplay rating={vehicle.overallRating} />
              </div>
            )}
            {inspectionData ? (
              <div className="mt-2 space-y-2">
                {Object.entries(inspectionData).map(([key, value]) => (
                  <SpecRow key={key} label={key} value={String(value)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Žádné údaje z prohlídky
              </p>
            )}
          </div>
        )}

        {activeTab === "description" && (
          <div>
            {vehicle.description ? (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {vehicle.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Žádný popis
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
