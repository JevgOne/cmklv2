"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VehiclePhotoCarousel } from "./VehiclePhotoCarousel";
import { VehicleSpecs } from "./VehicleSpecs";
import { VehicleStatusActions } from "./VehicleStatusActions";
import { VehicleContracts } from "./VehicleContracts";
import { ExclusiveSection } from "./ExclusiveSection";
import { EmailButton } from "@/components/pwa/emails/EmailButton";
import { EmailHistory } from "@/components/pwa/emails/EmailHistory";
import { VehiclePriceHistory } from "./VehiclePriceHistory";
import { VehicleTimeline } from "./VehicleTimeline";
import { EscalationForm } from "@/components/pwa/EscalationForm";
import { WorkflowChecklist } from "@/components/pwa/vehicles/WorkflowChecklist";
import { formatPrice, formatMileage } from "@/lib/utils";

// ---- Types ----

interface VehicleImage {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface VehicleInquiry {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string;
  status: string;
  createdAt: string;
  viewingDate: string | null;
}

interface DamageReport {
  id: string;
  description: string;
  severity: string;
  images: string | null;
  repaired: boolean;
  repairedAt: string | null;
  repairNote: string | null;
  createdAt: string;
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Contract {
  id: string;
  type: string;
  status: string;
  sellerName: string;
  pdfUrl: string | null;
  signedAt: string | null;
  createdAt: string;
}

interface ChangeLogEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  flagged: boolean;
  createdAt: string;
}

interface VehicleData {
  id: string;
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
  price: number;
  priceNegotiable: boolean;
  equipment: string | null;
  description: string | null;
  inspectionData: string | null;
  overallRating: number | null;
  status: string;
  rejectionReason: string | null;
  commission: number | null;
  viewCount: number;
  reservedFor: string | null;
  reservedAt: string | null;
  reservedPrice: number | null;
  soldPrice: number | null;
  soldAt: string | null;
  handoverCompleted: boolean;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  city: string;
  publishedAt: string | null;
  createdAt: string;
  exclusiveUntil: string | null;
  exclusiveContractId: string | null;
  images: VehicleImage[];
  inquiries: VehicleInquiry[];
  damageReports: DamageReport[];
  contracts: Contract[];
  changeLog: ChangeLogEntry[];
}

interface ExclusiveContractData {
  id: string;
  exclusiveEndDate: string | null;
  earlyTermination: boolean;
  terminationReason: string | null;
  violationReported: boolean;
  violationDetails: string | null;
  penaltyAmount: number | null;
  pdfUrl: string | null;
  status: string;
}

interface VehicleStats {
  viewCount: number;
  totalInquiries: number;
  newInquiries: number;
  daysOnPlatform: number;
  damageReportsCount: number;
  contractsCount: number;
}

interface PaymentInfo {
  status: string;
  method: string;
  amount: number;
  confirmedAt: string | null;
}

interface VehicleDetailHubProps {
  vehicle: VehicleData;
  stats: VehicleStats;
  exclusiveContract: ExclusiveContractData | null;
  payment?: PaymentInfo;
}

// ---- Labels ----

const statusMap: Record<string, { variant: "verified" | "top" | "pending" | "rejected" | "default"; label: string }> = {
  ACTIVE: { variant: "verified", label: "Aktivní" },
  PENDING: { variant: "pending", label: "Ke schválení" },
  REJECTED: { variant: "rejected", label: "Zamítnuto" },
  DRAFT: { variant: "default", label: "Draft" },
  DRAFT_QUICK: { variant: "pending", label: "Rychlý draft" },
  SOLD: { variant: "top", label: "Prodáno" },
  PAID: { variant: "verified", label: "Zaplaceno" },
  RESERVED: { variant: "pending", label: "Rezervováno" },
  ARCHIVED: { variant: "default", label: "Archivováno" },
};

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

const inquiryStatusLabels: Record<string, string> = {
  NEW: "Nový",
  REPLIED: "Odpovězeno",
  VIEWING_SCHEDULED: "Prohlídka",
  NEGOTIATING: "Vyjednávání",
  RESERVED: "Rezervováno",
  SOLD: "Prodáno",
  NO_INTEREST: "Bez zájmu",
};

const severityLabels: Record<string, string> = {
  COSMETIC: "Kosmetické",
  FUNCTIONAL: "Funkční",
  SEVERE: "Vážné",
};

// ---- Component ----

const paymentMethodLabels: Record<string, string> = {
  CARD: "kartou",
  BANK_TRANSFER: "převodem",
  FINANCING: "financováním",
};

export function VehicleDetailHub({ vehicle, stats, exclusiveContract, payment }: VehicleDetailHubProps) {
  const [showEscalation, setShowEscalation] = useState(false);
  const statusInfo = statusMap[vehicle.status] || { variant: "default" as const, label: vehicle.status };
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;
  const newInquiries = vehicle.inquiries.filter((i) => i.status === "NEW");

  return (
    <div className="pb-24">
      {/* Back button overlay */}
      <div className="relative">
        <VehiclePhotoCarousel images={vehicle.images} title={title} />
        <Link
          href="/makler/vehicles"
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
        <div className="absolute top-4 right-4 z-10">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Header info */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vehicle.year} · {formatMileage(vehicle.mileage)} · {fuelLabels[vehicle.fuelType] || vehicle.fuelType} · {transmissionLabels[vehicle.transmission] || vehicle.transmission}
            {vehicle.enginePower && ` · ${vehicle.enginePower} kW`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-extrabold text-gray-900">
              {formatPrice(vehicle.price)}
            </p>
            {vehicle.priceNegotiable && (
              <Badge variant="default">K jednání</Badge>
            )}
          </div>
          {vehicle.commission && ["ACTIVE", "RESERVED", "SOLD"].includes(vehicle.status) && (
            <p className="text-sm text-orange-600 font-semibold mt-1">
              Vaše provize: {formatPrice(vehicle.commission)}
            </p>
          )}
        </div>

        {/* Payment status */}
        {payment && (
          <Card className={`p-4 ${
            payment.status === "PAID"
              ? "bg-green-50 border border-green-200"
              : payment.status === "PENDING" || payment.status === "PROCESSING"
              ? "bg-yellow-50 border border-yellow-200"
              : payment.status === "FAILED"
              ? "bg-red-50 border border-red-200"
              : ""
          }`}>
            <div className="flex items-center gap-2">
              {payment.status === "PAID" && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Zaplaceno {paymentMethodLabels[payment.method] || payment.method}
                    </p>
                    {payment.confirmedAt && (
                      <p className="text-xs text-green-600">
                        {new Date(payment.confirmedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </>
              )}
              {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-yellow-800">Čeká na platbu</p>
                </>
              )}
              {payment.status === "FAILED" && (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-red-800">Platba neúspěšná</p>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Exclusive contract */}
        <ExclusiveSection
          vehicleId={vehicle.id}
          exclusiveUntil={vehicle.exclusiveUntil}
          contract={exclusiveContract}
        />

        {/* Workflow Checklist */}
        <WorkflowChecklist
          vehicleId={vehicle.id}
          autoChecks={{
            hasContact: !!vehicle.sellerPhone,
            hasBasicInfo: !!vehicle.brand && !!vehicle.model,
            hasVin: !!vehicle.vin && vehicle.vin.length === 17,
            hasDescription: (vehicle.description?.length || 0) >= 20,
            hasPrice: vehicle.price > 0,
            hasSigned: vehicle.contracts.some((c) => c.status === "SIGNED"),
            isActive: vehicle.status === "ACTIVE",
          }}
        />

        {/* Seller info */}
        {vehicle.sellerName && (
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Prodejce</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">{vehicle.sellerName}</p>
              {vehicle.city && (
                <p className="text-xs text-gray-500">{vehicle.city}</p>
              )}
              {vehicle.sellerPhone && (
                <div className="flex gap-2">
                  <a href={`tel:${vehicle.sellerPhone}`} className="no-underline flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                      </svg>
                      Zavolat
                    </Button>
                  </a>
                  <a href={`sms:${vehicle.sellerPhone}`} className="no-underline flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      SMS
                    </Button>
                  </a>
                  <a href={`https://wa.me/${vehicle.sellerPhone.replace(/\s/g, "")}`} className="no-underline flex-1" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full">
                      WhatsApp
                    </Button>
                  </a>
                </div>
              )}
              {vehicle.sellerEmail && (
                <a href={`mailto:${vehicle.sellerEmail}`} className="no-underline block">
                  <Button variant="ghost" size="sm" className="w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {vehicle.sellerEmail}
                  </Button>
                </a>
              )}
              <Link
                href={`/makler/contacts?search=${encodeURIComponent(vehicle.sellerName || "")}`}
                className="no-underline block"
              >
                <Button variant="ghost" size="sm" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                  Otevřít v CRM
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Kontextové emaily */}
        {vehicle.status === "ACTIVE" && (
          <div className="flex gap-2">
            <EmailButton
              vehicleId={vehicle.id}
              vehicleName={title}
              defaultTemplate="FOLLOWUP"
              defaultRecipientEmail={vehicle.sellerEmail || undefined}
              defaultRecipientName={vehicle.sellerName || undefined}
              label="Poslat follow-up"
              variant="outline"
              size="sm"
              className="flex-1"
            />
            <EmailButton
              vehicleId={vehicle.id}
              vehicleName={title}
              defaultTemplate="PRICE_CHANGE"
              defaultRecipientEmail={vehicle.sellerEmail || undefined}
              defaultRecipientName={vehicle.sellerName || undefined}
              label="Navrhnout snížení ceny"
              variant="outline"
              size="sm"
              className="flex-1"
            />
          </div>
        )}
        {vehicle.status === "SOLD" && (
          <EmailButton
            vehicleId={vehicle.id}
            vehicleName={title}
            defaultTemplate="VEHICLE_SOLD"
            defaultRecipientEmail={vehicle.sellerEmail || undefined}
            defaultRecipientName={vehicle.sellerName || undefined}
            label="Oznámit prodej"
            variant="outline"
            size="sm"
          />
        )}

        {/* Inquiries alert */}
        {newInquiries.length > 0 && (
          <Link href={`/makler/messages/${vehicle.id}`} className="block no-underline">
            <Card className="p-4 flex items-center justify-between bg-orange-50 border border-orange-200">
              <div>
                <p className="font-semibold text-gray-900">
                  {newInquiries.length}{" "}
                  {newInquiries.length === 1
                    ? "nový dotaz"
                    : newInquiries.length < 5
                    ? "nové dotazy"
                    : "nových dotazů"}
                </p>
                <p className="text-sm text-gray-500">Kliknutím zobrazíte</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-500">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Card>
          </Link>
        )}

        {/* Statistics */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Statistiky</h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{stats.viewCount}</p>
              <p className="text-xs text-gray-500">Zobrazení</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{stats.totalInquiries}</p>
              <p className="text-xs text-gray-500">Dotazy</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{stats.daysOnPlatform}</p>
              <p className="text-xs text-gray-500">Dní na platformě</p>
            </Card>
          </div>
          {vehicle.status === "ACTIVE" && vehicle.publishedAt && (
            <Link
              href={`/vozidla/${vehicle.id}`}
              target="_blank"
              className="block mt-2 text-center text-sm text-orange-600 font-medium no-underline hover:underline"
            >
              Zobrazit veřejný inzerát
            </Link>
          )}
        </div>

        {/* Vehicle Specs */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Údaje vozu</h3>
          <VehicleSpecs vehicle={vehicle} />
        </div>

        {/* Photos grid */}
        {vehicle.images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Fotky <span className="text-gray-400 font-normal">({vehicle.images.length})</span>
              </h3>
              {["DRAFT", "DRAFT_QUICK", "ACTIVE"].includes(vehicle.status) && (
                <Link href={`/makler/vehicles/${vehicle.id}/edit?step=photos`} className="no-underline">
                  <Button variant="outline" size="sm">Upravit fotky</Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {vehicle.images.slice(0, 9).map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={img.url}
                    alt={`${title} foto`}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                </div>
              ))}
              {vehicle.images.length > 9 && (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{vehicle.images.length - 9}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price History */}
        <VehiclePriceHistory vehicleId={vehicle.id} />

        {/* Damage Reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              Poškození{" "}
              {vehicle.damageReports.length > 0 && (
                <span className="text-gray-400 font-normal">({vehicle.damageReports.length})</span>
              )}
            </h3>
          </div>
          {vehicle.damageReports.length > 0 ? (
            <div className="space-y-2">
              {vehicle.damageReports.map((report) => (
                <Card key={report.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {severityLabels[report.severity] || report.severity}
                        {" · "}
                        {report.reportedBy.firstName} {report.reportedBy.lastName}
                        {" · "}
                        {new Date(report.createdAt).toLocaleDateString("cs-CZ")}
                      </p>
                      {report.repairNote && (
                        <p className="text-xs text-gray-500 mt-1">
                          Oprava: {report.repairNote}
                        </p>
                      )}
                    </div>
                    {report.repaired ? (
                      <Badge variant="verified">Opraveno</Badge>
                    ) : (
                      <Badge variant="rejected">Neopraveno</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-400">Žádná poškození</p>
            </Card>
          )}
        </div>

        {/* Inquiries list */}
        {vehicle.inquiries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Dotazy kupujících{" "}
                <span className="text-gray-400 font-normal">({vehicle.inquiries.length})</span>
              </h3>
              <Link href={`/makler/messages/${vehicle.id}`} className="no-underline">
                <Button variant="ghost" size="sm">Zobrazit vše</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {vehicle.inquiries.slice(0, 5).map((inquiry) => {
                const statusLabel = inquiryStatusLabels[inquiry.status] || inquiry.status;
                const isNew = inquiry.status === "NEW";
                return (
                  <Card key={inquiry.id} className={`p-3 ${isNew ? "border border-orange-200 bg-orange-50/50" : ""}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{inquiry.buyerName}</p>
                          <Badge variant={isNew ? "new" : "default"}>{statusLabel}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{inquiry.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inquiry.createdAt).toLocaleDateString("cs-CZ")}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <a
                          href={`tel:${inquiry.buyerPhone}`}
                          className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600">
                            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Prohlídky */}
        {(() => {
          const viewings = vehicle.inquiries.filter((i) => i.viewingDate);
          if (viewings.length === 0) return null;
          return (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Prohlídky{" "}
                <span className="text-gray-400 font-normal">({viewings.length})</span>
              </h3>
              <div className="space-y-2">
                {viewings.map((viewing) => {
                  const viewingStatusLabel = inquiryStatusLabels[viewing.status] || viewing.status;
                  return (
                    <Card key={viewing.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{viewing.buyerName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(viewing.viewingDate!).toLocaleDateString("cs-CZ", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Badge variant={viewing.status === "VIEWING_SCHEDULED" ? "pending" : "default"}>
                          {viewingStatusLabel}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Contracts */}
        <VehicleContracts contracts={vehicle.contracts} vehicleId={vehicle.id} />

        {/* Emaily */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Emaily</h3>
            <EmailButton
              vehicleId={vehicle.id}
              vehicleName={title}
              defaultRecipientEmail={vehicle.sellerEmail || undefined}
              defaultRecipientName={vehicle.sellerName || undefined}
              variant="outline"
              size="sm"
            />
          </div>
          <EmailHistory vehicleId={vehicle.id} />
        </div>

        {/* Timeline */}
        <VehicleTimeline vehicleId={vehicle.id} />

        {/* Status Actions - at the bottom */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Akce</h3>
          <VehicleStatusActions vehicle={vehicle} />
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowEscalation(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Eskalovat
            </Button>
          </div>
        </div>

        {/* Escalation modal */}
        <EscalationForm
          open={showEscalation}
          onClose={() => setShowEscalation(false)}
          vehicleId={vehicle.id}
        />
      </div>
    </div>
  );
}
