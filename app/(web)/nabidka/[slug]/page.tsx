import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrustScore } from "@/components/ui/TrustScore";
import { VehicleGallery } from "@/components/web/VehicleGallery";
import { BrokerBox } from "@/components/web/BrokerBox";
import { ContactForm } from "@/components/web/ContactForm";
import { VehicleDetailTabs } from "./VehicleDetailTabs";
import { VehicleCard } from "@/components/web/VehicleCard";
import { ContactBrokerButton } from "./ContactBrokerButton";
import { prisma } from "@/lib/prisma";
import type { VehicleData } from "@/components/web/VehicleCard";

/* ------------------------------------------------------------------ */
/*  Label mapování                                                     */
/* ------------------------------------------------------------------ */

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  ELECTRIC: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  LPG: "LPG",
  CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál",
  AUTOMATIC: "Automat",
  DSG: "DSG",
  CVT: "CVT",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nové",
  LIKE_NEW: "Jako nové",
  EXCELLENT: "Výborný",
  GOOD: "Dobrý",
  FAIR: "Uspokojivý",
  DAMAGED: "Poškozené",
};

const bodyTypeLabels: Record<string, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  COMBI: "Combi",
  SUV: "SUV",
  COUPE: "Coupé",
  CABRIO: "Kabriolet",
  VAN: "MPV/Van",
  PICKUP: "Pickup",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Načtení vozidla dle slug
  const vehicle = await prisma.vehicle.findFirst({
    where: { slug, status: { in: ["ACTIVE", "SOLD", "RESERVED"] } },
    include: {
      images: { orderBy: { order: "asc" } },
      broker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          slug: true,
          avatar: true,
          cities: true,
        },
      },
      changeLog: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!vehicle) notFound();

  // Inkrementace počtu zobrazení (fire-and-forget)
  prisma.vehicle
    .update({
      where: { id: vehicle.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {
      /* noncritical */
    });

  // Načtení podobných vozidel
  const similarDb = await prisma.vehicle.findMany({
    where: {
      status: "ACTIVE",
      brand: vehicle.brand,
      id: { not: vehicle.id },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      broker: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    take: 3,
  });

  // Map podobná vozidla na VehicleData
  const similarCars: VehicleData[] = similarDb.map((v) => {
    const primaryImage = v.images[0];
    let badge: "verified" | "top" | "default" = "default";
    if (v.trustScore >= 95) badge = "top";
    else if (v.trustScore >= 80) badge = "verified";

    return {
      id: v.id,
      name: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
      year: v.year,
      km: new Intl.NumberFormat("cs-CZ").format(v.mileage) + " km",
      fuel: fuelLabels[v.fuelType] || v.fuelType,
      transmission: transmissionLabels[v.transmission] || v.transmission,
      city: v.city,
      hp: v.enginePower ? `${v.enginePower} HP` : "",
      price: new Intl.NumberFormat("cs-CZ").format(v.price),
      trust: v.trustScore,
      badge,
      photo: primaryImage?.url || "/images/placeholder-car.jpg",
      slug: v.slug || v.id,
      sellerType: v.sellerType as "broker" | "private",
      brokerName: v.broker
        ? `${v.broker.firstName} ${v.broker.lastName}`
        : undefined,
    };
  });

  // Příprava dat pro zobrazení
  const vehicleName = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const formattedPrice = new Intl.NumberFormat("cs-CZ").format(vehicle.price);
  const formattedKm = new Intl.NumberFormat("cs-CZ").format(vehicle.mileage);
  const fuelLabel = fuelLabels[vehicle.fuelType] || vehicle.fuelType;
  const transLabel = transmissionLabels[vehicle.transmission] || vehicle.transmission;
  const conditionLabel = conditionLabels[vehicle.condition] || vehicle.condition;
  const bodyLabel = vehicle.bodyType ? (bodyTypeLabels[vehicle.bodyType] || vehicle.bodyType) : null;

  // Fotky pro galerii
  const photos =
    vehicle.images.length > 0
      ? vehicle.images.map((img) => ({
          src: img.url,
          alt: `${vehicleName} — foto ${img.order + 1}`,
        }))
      : [
          {
            src: "/images/placeholder-car.jpg",
            alt: `${vehicleName} — bez fotky`,
          },
        ];

  // Výbava (parsování JSON)
  let equipment: string[] = [];
  if (vehicle.equipment) {
    try {
      equipment = JSON.parse(vehicle.equipment);
    } catch {
      equipment = [];
    }
  }

  // Parametry vozidla
  const parameters: { label: string; value: string }[] = [
    { label: "Značka", value: vehicle.brand },
    { label: "Model", value: vehicle.model },
    { label: "Rok výroby", value: String(vehicle.year) },
    { label: "Najeto", value: `${formattedKm} km` },
    { label: "Palivo", value: fuelLabel },
    { label: "Převodovka", value: transLabel },
  ];

  if (vehicle.enginePower) {
    parameters.push({
      label: "Výkon",
      value: `${vehicle.enginePower} HP`,
    });
  }
  if (vehicle.engineCapacity) {
    parameters.push({
      label: "Objem motoru",
      value: `${vehicle.engineCapacity} ccm`,
    });
  }
  if (bodyLabel) {
    parameters.push({ label: "Karoserie", value: bodyLabel });
  }
  if (vehicle.color) {
    parameters.push({ label: "Barva", value: vehicle.color });
  }
  if (vehicle.doorsCount) {
    parameters.push({ label: "Počet dveří", value: String(vehicle.doorsCount) });
  }
  if (vehicle.seatsCount) {
    parameters.push({ label: "Počet sedadel", value: String(vehicle.seatsCount) });
  }
  parameters.push({ label: "Stav", value: conditionLabel });
  if (vehicle.stkValidUntil) {
    const stkDate = new Date(vehicle.stkValidUntil);
    parameters.push({
      label: "STK do",
      value: `${String(stkDate.getMonth() + 1).padStart(2, "0")}/${stkDate.getFullYear()}`,
    });
  }
  parameters.push({
    label: "Servisní knížka",
    value: vehicle.serviceBook ? "Ano" : "Ne",
  });
  parameters.push({
    label: "VIN",
    value: vehicle.vin.startsWith("PRIV") ? "Nedostupný" : vehicle.vin,
  });

  // Historie změn
  const history = vehicle.changeLog.map((entry) => {
    const date = new Date(entry.createdAt);
    const formattedDate = date.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let event = `Změna pole "${entry.field}"`;
    if (entry.field === "status") {
      event = `Stav změněn z "${entry.oldValue}" na "${entry.newValue}"`;
    } else if (entry.field === "price") {
      event = `Cena změněna z ${entry.oldValue ? new Intl.NumberFormat("cs-CZ").format(parseInt(entry.oldValue)) : "?"} Kč na ${entry.newValue ? new Intl.NumberFormat("cs-CZ").format(parseInt(entry.newValue)) : "?"} Kč`;
    } else if (entry.field === "mileage") {
      event = `Nájezd změněn z ${entry.oldValue ? new Intl.NumberFormat("cs-CZ").format(parseInt(entry.oldValue)) : "?"} km na ${entry.newValue ? new Intl.NumberFormat("cs-CZ").format(parseInt(entry.newValue)) : "?"} km`;
    }

    return {
      date: formattedDate,
      event,
      detail: entry.reason || (entry.flagReason ? `⚠️ ${entry.flagReason}` : null),
    };
  });

  // Přidat "Inzerát vytvořen" na konec historie
  const createdDate = new Date(vehicle.createdAt);
  history.push({
    date: createdDate.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    event: "Inzerát vytvořen",
    detail: null,
  });

  // Broker data
  const broker = vehicle.broker;
  const brokerName = broker
    ? `${broker.firstName} ${broker.lastName}`
    : null;
  const brokerInitials = broker
    ? `${broker.firstName.charAt(0)}${broker.lastName.charAt(0)}`
    : "";
  const brokerPhone = broker?.phone || "";
  const brokerSlug = broker?.slug || "";
  const brokerCities = broker?.cities
    ? (() => {
        try {
          return (JSON.parse(broker.cities) as string[]).join(", ");
        } catch {
          return broker.cities;
        }
      })()
    : "";

  // STK badge
  const stkText = vehicle.stkValidUntil
    ? `${String(new Date(vehicle.stkValidUntil).getMonth() + 1).padStart(2, "0")}/${new Date(vehicle.stkValidUntil).getFullYear()}`
    : null;

  const isBrokerListing = vehicle.sellerType === "broker" && broker;
  const isPrivateListing = vehicle.sellerType === "private";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="text-sm text-gray-500 flex items-center gap-2 overflow-hidden">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Domů
          </Link>
          <span>/</span>
          <Link
            href="/nabidka"
            className="hover:text-gray-900 transition-colors"
          >
            Nabídka
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{vehicleName}</span>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* Top section: Gallery + Info Panel                             */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Gallery */}
          <VehicleGallery photos={photos} />

          {/* Info Panel */}
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                {vehicleName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {vehicle.year} ·{" "}
                {formattedKm} km ·{" "}
                {fuelLabel} · {transLabel}
              </p>
            </div>

            {/* Price */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-[32px] font-extrabold text-gray-900">
                  {formattedPrice}
                </span>
                <span className="text-lg font-medium text-gray-400">Kč</span>
              </div>
              {vehicle.priceNegotiable && (
                <span className="text-sm text-orange-500 font-semibold">
                  Cena k jednání
                </span>
              )}
            </div>

            {/* Trust Score + View count */}
            <div className="flex items-center gap-4">
              {isBrokerListing && <TrustScore value={vehicle.trustScore} />}
              {isPrivateListing && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-[13px] font-medium text-gray-600">
                  Soukromý prodejce
                </span>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-[pulse-dot_1.5s_infinite]" />
                {vehicle.viewCount} zobrazení
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {isBrokerListing && vehicle.trustScore >= 80 && (
                <Badge variant="verified">✓ Ověřeno</Badge>
              )}
              {vehicle.serviceBook && (
                <Badge variant="default">📋 Servisní knížka</Badge>
              )}
              {stkText && (
                <Badge variant="default">🛡️ STK do {stkText}</Badge>
              )}
            </div>

            {/* CTA Buttons */}
            {isBrokerListing && (
              <div className="flex flex-col gap-3">
                <ContactBrokerButton />
                {brokerPhone && (
                  <a
                    href={`tel:${brokerPhone.replace(/\s/g, "")}`}
                    className="no-underline"
                  >
                    <Button variant="outline" size="lg" className="w-full">
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Zavolat {brokerPhone}
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Private listing contact info */}
            {isPrivateListing && (
              <div className="flex flex-col gap-3">
                {vehicle.contactPhone && (
                  <a
                    href={`tel:${vehicle.contactPhone.replace(/\s/g, "")}`}
                    className="no-underline"
                  >
                    <Button variant="primary" size="lg" className="w-full">
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Zavolat {vehicle.contactPhone}
                    </Button>
                  </a>
                )}
                {vehicle.contactEmail && (
                  <a
                    href={`mailto:${vehicle.contactEmail}`}
                    className="no-underline"
                  >
                    <Button variant="outline" size="lg" className="w-full">
                      Napsat e-mail
                    </Button>
                  </a>
                )}
                {vehicle.contactName && (
                  <p className="text-sm text-gray-500 text-center">
                    Kontakt: {vehicle.contactName}
                  </p>
                )}
              </div>
            )}

            {/* Location */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">
                📍 {vehicle.city}
                {vehicle.district ? ` — ${vehicle.district}` : ""}
              </div>
              {isBrokerListing
                ? "Přesnou adresu sdělí makléř po domluvě"
                : "Kontaktujte prodejce pro domluvení prohlídky"}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Tabs: Parametry / Výbava / Popis / Historie                  */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <VehicleDetailTabs
          parameters={parameters}
          equipment={equipment}
          description={vehicle.description || "Bez popisu."}
          history={history}
        />
      </section>

      {/* ============================================================ */}
      {/* Contact Form + Broker Box (only for broker listings)         */}
      {/* ============================================================ */}
      {isBrokerListing && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
            <ContactForm vehicleName={vehicleName} />
            <BrokerBox
              name={brokerName!}
              initials={brokerInitials}
              region={brokerCities || "Česká republika"}
              rating={4.8}
              salesCount={0}
              avgDays={0}
              phone={brokerPhone}
              slug={brokerSlug}
            />
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* Location map placeholder                                     */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Lokace vozidla
          </h3>
          <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <div className="font-semibold text-gray-600">
                {vehicle.city}
                {vehicle.district ? ` — ${vehicle.district}` : ""}
              </div>
              <div className="text-sm mt-1">
                {isBrokerListing
                  ? "Přesnou adresu sdělí makléř po domluvě"
                  : "Kontaktujte prodejce pro domluvení prohlídky"}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ============================================================ */}
      {/* Similar vehicles                                             */}
      {/* ============================================================ */}
      {similarCars.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-[22px] font-extrabold text-gray-900 mb-6">
            Podobná vozidla
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {similarCars.map((car) => (
              <VehicleCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
