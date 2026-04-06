import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeadActions } from "@/components/pwa/leads/LeadActions";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEW: { label: "Nový", variant: "new" },
  ASSIGNED: { label: "Přijatý", variant: "verified" },
  CONTACTED: { label: "Kontaktováno", variant: "pending" },
  MEETING_SCHEDULED: { label: "Schůzka domluvena", variant: "top" },
  VEHICLE_ADDED: { label: "Auto nabráno", variant: "verified" },
  REJECTED: { label: "Odmítnutý", variant: "rejected" },
  EXPIRED: { label: "Expiroval", variant: "default" },
};

const statusTimeline = [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "VEHICLE_ADDED",
];

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let lead;
  try {
    lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, status: true },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!lead) {
    notFound();
  }

  const statusInfo = statusLabels[lead.status] ?? { label: lead.status, variant: "default" as const };
  const currentStepIndex = statusTimeline.indexOf(lead.status);
  const isRejected = lead.status === "REJECTED";
  const isExpired = lead.status === "EXPIRED";

  return (
    <div className="p-4 space-y-4">
      {/* Zpet */}
      <Link
        href="/makler/leads"
        className="inline-flex items-center gap-1 text-sm text-gray-500 no-underline hover:text-gray-700"
      >
        ← Zpět na leady
      </Link>

      {/* Hlavicka */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {lead.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {lead.source && (
              <span className="text-xs text-gray-400">
                Zdroj: {lead.source === "WEB_FORM" ? "Web" : lead.source === "EXTERNAL_APP" ? "Externí" : lead.source === "MANUAL" ? "Ručně" : "Doporučení"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kontaktni info */}
      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Kontakt
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Telefon</div>
              <div className="font-semibold text-gray-900">{lead.phone}</div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="w-10 h-10 bg-success-50 text-success-500 rounded-lg flex items-center justify-center no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href={`sms:${lead.phone}`}
                className="w-10 h-10 bg-info-50 text-info-500 rounded-lg flex items-center justify-center no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center no-underline"
              >
                WA
              </a>
            </div>
          </div>

          {lead.email && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Email</div>
                <div className="font-semibold text-gray-900">{lead.email}</div>
              </div>
              <a
                href={`mailto:${lead.email}`}
                className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center no-underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
              </a>
            </div>
          )}

          {lead.city && (
            <div>
              <div className="text-xs text-gray-400">Město</div>
              <div className="font-semibold text-gray-900">{lead.city}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Info o aute */}
      {(lead.brand || lead.model || lead.year || lead.mileage || lead.expectedPrice) && (
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Informace o vozidle
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(lead.brand || lead.model) && (
              <div>
                <div className="text-xs text-gray-400">Značka / Model</div>
                <div className="font-semibold text-gray-900">
                  {[lead.brand, lead.model].filter(Boolean).join(" ")}
                </div>
              </div>
            )}
            {lead.year && (
              <div>
                <div className="text-xs text-gray-400">Rok výroby</div>
                <div className="font-semibold text-gray-900">{lead.year}</div>
              </div>
            )}
            {lead.mileage && (
              <div>
                <div className="text-xs text-gray-400">Najeto</div>
                <div className="font-semibold text-gray-900">
                  {lead.mileage.toLocaleString("cs-CZ")} km
                </div>
              </div>
            )}
            {lead.expectedPrice && (
              <div>
                <div className="text-xs text-gray-400">Očekávaná cena</div>
                <div className="font-semibold text-gray-900">
                  {lead.expectedPrice.toLocaleString("cs-CZ")} Kč
                </div>
              </div>
            )}
          </div>
          {lead.description && (
            <div>
              <div className="text-xs text-gray-400">Poznámka</div>
              <div className="text-sm text-gray-700 mt-1">{lead.description}</div>
            </div>
          )}
        </Card>
      )}

      {/* Status timeline */}
      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Průběh
        </h2>
        <div className="flex items-center gap-1">
          {statusTimeline.map((step, index) => {
            const isCompleted = !isRejected && !isExpired && currentStepIndex >= index;
            const isCurrent = step === lead.status;
            const stepLabel = statusLabels[step]?.label ?? step;

            return (
              <div key={step} className="flex-1 text-center">
                <div
                  className={`h-2 rounded-full mb-1 ${
                    isCompleted
                      ? "bg-orange-500"
                      : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    isCurrent
                      ? "font-bold text-orange-500"
                      : isCompleted
                        ? "font-medium text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  {stepLabel}
                </span>
              </div>
            );
          })}
        </div>
        {isRejected && lead.rejectionReason && (
          <div className="mt-2 p-3 bg-error-50 rounded-lg">
            <div className="text-xs font-bold text-error-500">Důvod odmítnutí</div>
            <div className="text-sm text-error-600 mt-0.5">{lead.rejectionReason}</div>
          </div>
        )}
      </Card>

      {/* Propojeni s vozidlem */}
      {lead.vehicle && (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            Propojené vozidlo
          </h2>
          <Link
            href={`/makler/vehicles/${lead.vehicle.id}`}
            className="flex items-center justify-between no-underline"
          >
            <span className="font-semibold text-gray-900">
              {lead.vehicle.brand} {lead.vehicle.model}
            </span>
            <span className="text-gray-400">→</span>
          </Link>
        </Card>
      )}

      {/* Akce */}
      {!isRejected && !isExpired && lead.status !== "VEHICLE_ADDED" && (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            Akce
          </h2>
          <LeadActions
            leadId={lead.id}
            status={lead.status}
            brand={lead.brand}
            model={lead.model}
          />
        </Card>
      )}

      {/* Nabrat auto CTA */}
      {(lead.status === "CONTACTED" || lead.status === "MEETING_SCHEDULED") && !lead.vehicleId && (
        <Link
          href={`/makler/vehicles/new?leadId=${lead.id}${lead.brand ? `&brand=${encodeURIComponent(lead.brand)}` : ""}${lead.model ? `&model=${encodeURIComponent(lead.model)}` : ""}`}
          className="block no-underline"
        >
          <Button variant="primary" size="lg" className="w-full">
            Nabrat toto auto
          </Button>
        </Link>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 text-center pt-2">
        Vytvořeno: {new Date(lead.createdAt).toLocaleDateString("cs-CZ")} ·
        Aktualizováno: {new Date(lead.updatedAt).toLocaleDateString("cs-CZ")}
      </div>
    </div>
  );
}
