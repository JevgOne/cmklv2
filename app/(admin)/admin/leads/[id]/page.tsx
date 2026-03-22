import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeadAssignment } from "@/components/admin/leads/LeadAssignment";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "new" | "verified" | "pending" | "top" | "rejected" | "default" }> = {
  NEW: { label: "Novy", variant: "new" },
  ASSIGNED: { label: "Prijaty", variant: "verified" },
  CONTACTED: { label: "Kontaktovano", variant: "pending" },
  MEETING_SCHEDULED: { label: "Schuzka domluvena", variant: "top" },
  VEHICLE_ADDED: { label: "Auto nabrano", variant: "verified" },
  REJECTED: { label: "Odmitnuty", variant: "rejected" },
  EXPIRED: { label: "Expiroval", variant: "default" },
};

const sourceLabels: Record<string, string> = {
  WEB_FORM: "Webovy formular",
  EXTERNAL_APP: "Externi aplikace",
  MANUAL: "Rucne zadano",
  REFERRAL: "Doporuceni",
};

interface AdminLeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: AdminLeadDetailPageProps) {
  const { id } = await params;

  let lead;
  try {
    lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        region: {
          select: { id: true, name: true },
        },
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

  // Nacteni maklefu pro prirazeni
  const brokers = await prisma.user.findMany({
    where: {
      role: "BROKER",
      status: "ACTIVE",
      ...(lead.regionId ? { regionId: lead.regionId } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { firstName: "asc" },
  });

  const brokerOptions = brokers.map((b) => ({
    value: b.id,
    label: `${b.firstName} ${b.lastName}`,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <Link href="/admin/leads" className="hover:text-gray-700 no-underline text-gray-500">
            Leady
          </Link>
          <span>/</span>
          <span className="text-gray-900">Detail</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {lead.name}
          </h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Hlavni info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Kontaktni udaje */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-4">
              Kontaktni udaje
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Jmeno</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{lead.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Telefon</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  <a href={`tel:${lead.phone}`} className="text-orange-500 no-underline">
                    {lead.phone}
                  </a>
                </div>
              </div>
              {lead.email && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Email</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    <a href={`mailto:${lead.email}`} className="text-orange-500 no-underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}
              {lead.city && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Mesto</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{lead.city}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Info o vozidle */}
          {(lead.brand || lead.model || lead.year || lead.mileage || lead.expectedPrice) && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-[18px] font-bold text-gray-900 mb-4">
                Informace o vozidle
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(lead.brand || lead.model) && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Znacka / Model</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {[lead.brand, lead.model].filter(Boolean).join(" ")}
                    </div>
                  </div>
                )}
                {lead.year && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Rok</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">{lead.year}</div>
                  </div>
                )}
                {lead.mileage && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Najeto</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {lead.mileage.toLocaleString("cs-CZ")} km
                    </div>
                  </div>
                )}
                {lead.expectedPrice && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Ocekavana cena</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {lead.expectedPrice.toLocaleString("cs-CZ")} Kc
                    </div>
                  </div>
                )}
              </div>
              {lead.description && (
                <div className="mt-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Popis</div>
                  <div className="text-sm text-gray-700 mt-1">{lead.description}</div>
                </div>
              )}
            </Card>
          )}

          {/* Propojene vozidlo */}
          {lead.vehicle && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-[18px] font-bold text-gray-900 mb-4">
                Propojene vozidlo
              </h2>
              <Link
                href={`/admin/vehicles/${lead.vehicle.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg no-underline hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {lead.vehicle.brand} {lead.vehicle.model}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Stav: {lead.vehicle.status}
                  </div>
                </div>
                <span className="text-gray-400 text-lg">→</span>
              </Link>
            </Card>
          )}

          {/* Odmitnuti */}
          {lead.status === "REJECTED" && lead.rejectionReason && (
            <Card className="p-4 sm:p-6 border-2 border-error-200">
              <h2 className="text-[18px] font-bold text-error-500 mb-2">
                Odmitnuty
              </h2>
              <p className="text-sm text-gray-700">{lead.rejectionReason}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Prirazeni */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-4">
              Prirazeni makleri
            </h2>
            <LeadAssignment
              leadId={lead.id}
              currentBrokerId={lead.assignedToId}
              brokerOptions={brokerOptions}
            />
            {lead.assignedBy && (
              <div className="mt-3 text-xs text-gray-400">
                Prirazeno: {lead.assignedBy.firstName} {lead.assignedBy.lastName}
                {lead.assignedAt && (
                  <> · {new Date(lead.assignedAt).toLocaleDateString("cs-CZ")}</>
                )}
              </div>
            )}
          </Card>

          {/* Metadata */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-4">
              Detaily
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Zdroj</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {sourceLabels[lead.source] ?? lead.source}
                </div>
                {lead.sourceDetail && (
                  <div className="text-xs text-gray-500 mt-0.5">{lead.sourceDetail}</div>
                )}
              </div>
              {lead.externalId && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Externi ID</div>
                  <div className="text-sm font-mono text-gray-900 mt-1">{lead.externalId}</div>
                </div>
              )}
              {lead.region && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Region</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{lead.region.name}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Vytvoreno</div>
                <div className="text-sm text-gray-900 mt-1">
                  {new Date(lead.createdAt).toLocaleString("cs-CZ")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Aktualizovano</div>
                <div className="text-sm text-gray-900 mt-1">
                  {new Date(lead.updatedAt).toLocaleString("cs-CZ")}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
